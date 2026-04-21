import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")

NETWORKS = {
    "ethereum": "https://api.etherscan.io/api",
    "bsc": "https://api.bscscan.com/api",
    "polygon": "https://api.polygonscan.com/api"
}

def fetch_source_code(address: str, network: str = "ethereum") -> str:
    """
    Fetch the verified smart contract source code from Etherscan/BscScan/PolygonScan.
    Returns the source code as a string, or raises ValueError if not verified/found.
    """
    if network not in NETWORKS:
        raise ValueError(f"Unsupported network: {network}")

    url = NETWORKS[network]
    params = {
        "module": "contract",
        "action": "getsourcecode",
        "address": address,
        "apikey": ETHERSCAN_API_KEY
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        raise ValueError(f"Failed to connect to block explorer API: {str(e)}")

    if data.get("status") != "1":
        msg = data.get("message", "Unknown error")
        res = data.get("result", "")
        # Handle specific error for unverified contracts
        if "NOT VERIFIED" in str(res).upper() or "NOT VERIFIED" in msg.upper() or res == "":
            raise ValueError("Contract is NOT VERIFIED. Source code is unavailable. This is a HIGH RISK red flag!")
        raise ValueError(f"API Error: {msg} - {res}")

    results = data.get("result", [])
    if not results:
        raise ValueError("No result found for this address.")

    contract_data = results[0]
    source_code = contract_data.get("SourceCode", "")

    if not source_code:
        raise ValueError("Contract is NOT VERIFIED. Source code is unavailable. This is a HIGH RISK red flag!")

    # Etherscan multi-file verification wraps JSON in {{ ... }}
    if source_code.startswith("{{") and source_code.endswith("}}"):
        source_code = source_code[1:-1]
        try:
            parsed = json.loads(source_code)
            combined_source = ""
            for filename, filedata in parsed.get("sources", {}).items():
                combined_source += f"// File: {filename}\n"
                combined_source += filedata.get("content", "") + "\n\n"
            return combined_source
        except Exception:
            pass
    elif source_code.startswith("{") and source_code.endswith("}"):
        # Standard JSON multi-file format without double braces
        try:
            parsed = json.loads(source_code)
            combined_source = ""
            for filename, filedata in parsed.get("sources", {}).items():
                combined_source += f"// File: {filename}\n"
                combined_source += filedata.get("content", "") + "\n\n"
            return combined_source
        except Exception:
            pass

    return source_code
