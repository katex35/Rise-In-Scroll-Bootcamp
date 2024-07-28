// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title ScrollBank
 * @dev This contract implements basic banking functionalities along with a simple gambling feature.
 */
contract ScrollBank {
    using Address for address;

    address public owner;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => bool)) public accessList; // Mapping to manage access control
    mapping(address => address[]) private accessGranted; // List of addresses that each user has granted access to
    uint256 public totalDeposits;
    uint256 public totalLiquidity;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event CoinFlipResult(address indexed user, bool won, uint256 amount);
    event LiquidityAdded(address indexed owner, uint256 amount);
    event LiquidityWithdrawn(address indexed owner, uint256 amount);
    event AccessGranted(address indexed owner, address indexed allowedUser);
    event AccessRevoked(address indexed owner, address indexed revokedUser);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    modifier onlyPositive(uint256 amount) {
        require(amount > 0, "Amount/Value must be greater than 0.");
        _;
    }

    modifier hasEnoughBalance(address _address, uint256 amount) {
        require(balances[_address] >= amount, "Insufficient balance.");
        _;
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "Cannot transfer to the zero address");
        _;
    }

    modifier onlyAllowed(address _address) {
        require(msg.sender == _address || accessList[_address][msg.sender], "Not authorized.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Add liquidity to the contract for gambling purposes.
     * @dev Only the owner can call this function.
     */
    function addLiquidity() external payable onlyOwner onlyPositive(msg.value) {
        totalLiquidity += msg.value;
        emit LiquidityAdded(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw liquidity from the contract.
     * @param amount The amount of Ether to withdraw.
     * @dev Only the owner can call this function.
     */
    function withdrawLiquidity(uint256 amount) external onlyOwner onlyPositive(amount) {
        require(totalLiquidity >= amount, "Insufficient liquidity balance.");
        require(address(this).balance >= amount, "Insufficient contract balance.");
        totalLiquidity -= amount;
        payable(owner).transfer(amount);
        emit LiquidityWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Deposit Ether into the contract.
     * @dev The Ether sent along with the transaction is recorded.
     */
    function deposit() external payable onlyPositive(msg.value) {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw Ether from the contract.
     * @param amount The amount of Ether to withdraw.
     */
    function withdraw(uint256 amount) external onlyPositive(amount) hasEnoughBalance(msg.sender, amount) {
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount);
    }

    /**
    * @notice Withdraw Ether from another user's balance, given access is granted.
    * @param _address The address of the account owner.
    * @param amount The amount of Ether to withdraw.
    */
    function withdrawFor(address _address, uint256 amount) external onlyPositive(amount) hasEnoughBalance(_address, amount) onlyAllowed(_address) {
        balances[_address] -= amount;
        totalDeposits -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdraw(_address, amount);
    }

    /**
    * @notice Deposit Ether into another user's balance, given access is granted.
    * @param _address The address of the account owner.
    */
    function depositFor(address _address) external payable onlyPositive(msg.value) onlyAllowed(_address) {
        balances[_address] += msg.value;
        totalDeposits += msg.value;
        emit Deposit(_address, msg.value);
    }

    /**
     * @notice Transfer Ether from one user to another within the contract.
     * @param to The address of the recipient.
     * @param amount The amount of Ether to transfer.
     */
    function transferFromBank(address to, uint256 amount) external onlyPositive(amount) validAddress(to) hasEnoughBalance(msg.sender, amount) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
    }

    /**
     * @notice Transfer Ether directly from the sender's wallet to another address.
     * @param to The address of the recipient.
     */
    function transferFromWallet(address to) external payable validAddress(to) onlyPositive(msg.value) {
        payable(to).transfer(msg.value);
        emit Transfer(msg.sender, to, msg.value);
    }

    /**
     * @notice Gamble by flipping a coin with a specified bet amount.
     * @dev If the user wins, they double their bet; otherwise, they lose their bet and the amount is added to the contract's liquidity.
     */
    function coinFlip() external payable onlyPositive(msg.value) {
        require(address(this).balance >= msg.value * 2, "Insufficient contract balance to cover bet.");

        uint256 random = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender))) % 2;
        bool won = random == 1;

        if (won) {
            payable(msg.sender).transfer(msg.value * 2);
            totalLiquidity -= msg.value;
        } else {
            totalLiquidity += msg.value;
        }

        emit CoinFlipResult(msg.sender, won, msg.value);
    }

    /**
     * @notice Grant access to another user to withdraw and deposit on your behalf.
     * @param user The address of the user to grant access.
     */
    function grantAccess(address user) external validAddress(user) {
        require(!accessList[msg.sender][user], "Access already granted to this user.");
        accessList[msg.sender][user] = true;
        accessGranted[msg.sender].push(user);
        emit AccessGranted(msg.sender, user);
    }

    /**
     * @notice Revoke access from another user.
     * @param user The address of the user to revoke access.
     */
    function revokeAccess(address user) external validAddress(user) {
        accessList[msg.sender][user] = false;

        address[] storage userList = accessGranted[msg.sender];
        for (uint i = 0; i < userList.length; i++) {
            if (userList[i] == user) {
                userList[i] = userList[userList.length - 1];
                userList.pop();
                break;
            }
        }

        emit AccessRevoked(msg.sender, user);
    }

    /**
     * @notice Get the list of addresses that have access to a specific user's balance.
     * @param _address The address of the account owner.
     * @return The list of addresses that have been granted access.
     */
    function getAccessList(address _address) external view returns (address[] memory) {
        return accessGranted[_address];
    }

    /**
     * @notice Fallback function to accept Ether directly.
     */
    receive() external payable {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Get the total deposits in the contract.
     * @return The total amount of deposits in the contract.
     */
    function getTotalDeposits() external view returns (uint256) {
        return totalDeposits;
    }

    /**
     * @notice Get the total liquidity in the contract.
     * @return The total amount of liquidity in the contract.
     */
    function getTotalLiquidity() external view returns (uint256) {
        return totalLiquidity;
    }
}