// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SafeVault
 * @dev A secure savings vault with proper access controls
 * @notice Users can deposit and withdraw their own funds safely
 * @author SafeVault Team
 */
contract SafeVault {
    mapping(address => uint256) private balances;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    
    /**
     * @notice Deposit ETH into the vault
     * @dev Funds are tracked per-user in the balances mapping
     */
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw your own funds from the vault
     * @param amount The amount of ETH to withdraw
     */
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Check your vault balance
     * @return The caller's balance in wei
     */
    function getBalance() external view returns (uint256) {
        return balances[msg.sender];
    }
}
