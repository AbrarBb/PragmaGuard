# 🚀 PragmaGuard Deployment Master Guide

This guide will walk you through deploying PragmaGuard to **Hugging Face Spaces** for free. This setup runs both the Next.js frontend and FastAPI backend in a single 16GB RAM container.

---

## 🛠️ Phase 1: Preparation (GitHub)

Ensure your repository is up to date with the latest files I've created:
1.  **Dockerfile**: The blueprint for the container.
2.  **start.sh**: The script that launches both servers.
3.  **frontend/next.config.mjs**: Contains the `rewrites` to connect frontend to backend.

---

## 🤗 Phase 2: Create a Hugging Face Space

1.  **Sign Up**: Create an account at [huggingface.co](https://huggingface.co/).
2.  **New Space**: Click **"New Space"** or go to [huggingface.co/new-space](https://huggingface.co/new-space).
3.  **Basic Settings**:
    *   **Space Name**: `PragmaGuard`
    *   **License**: `mit`
    *   **SDK**: Select **Docker**.
    *   **Docker Template**: Choose **Blank**.
    *   **Space Hardware**: Choose **CPU Basic (Free - 16GB RAM)**.
    *   **Visibility**: Public.
4.  **Create Space**: Click the "Create Space" button.

---

## 🔑 Phase 3: Set Environment Secrets

PragmaGuard needs your Etherscan API key to fetch contract source code.
1.  In your new Space, go to the **Settings** tab (top right).
2.  Scroll down to **Variables and secrets**.
3.  Click **New secret**.
4.  **Name**: `ETHERSCAN_API_KEY`
5.  **Value**: Your actual API key from Etherscan.
6.  Click **Save**.

---

## ⬆️ Phase 4: Upload Your Code

You can either use the web interface or Git.

### Option A: Via Git (Recommended)
Open your terminal in your local `PragmaGuard` folder and run:

```bash
# Add Hugging Face as a remote (Replace YOUR_USERNAME)
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/PragmaGuard

# Push your code
git push hf main --force
```

### Option B: Web Upload
1.  Go to the **Files** tab in your Space.
2.  Click **Add file** -> **Upload files**.
3.  Drag and drop your entire project folder (excluding `node_modules` and `.git`).
4.  Commit changes.

---

## 🏗️ Phase 5: Build & Launch

1.  Once you push/upload, Hugging Face will automatically start the **Building** process.
2.  You can watch the logs in the **Logs** tab.
3.  **Building** takes 3-5 minutes (it installs PyTorch and builds Next.js).
4.  Once the status changes to **Running**, your app is live!

---

## 📝 Troubleshooting

-   **"Out of Memory"**: This shouldn't happen on Hugging Face (16GB is plenty), but if it does, check if you've accidentally loaded more than 3 models.
-   **API Error**: Ensure your `ETHERSCAN_API_KEY` is exactly correct in the Secrets tab.
-   **Favicon not showing**: Hard refresh your browser (`Ctrl + F5`) once the app is live.

---

## ✅ Deployment Checklist
- [ ] Dockerfile is in the root.
- [ ] start.sh is in the root.
- [ ] ETHERSCAN_API_KEY secret is set in Hugging Face.
- [ ] Build status is "Running".

**Congratulations! Your forensic smart contract auditor is now public.**
