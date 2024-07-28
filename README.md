# ScrollBank

**Contract Address:** `0x3B22A5fb8DAB45287272D76c6A89805633029774`

**ScrollBank** is an application developed on the Scroll network that allows users and owners to perform various financial transactions. The application has two main access types: Owner Access and User Access. Additionally, it features a game called **CoinFlip**.

## Features

### Owner Access
- Allows liquidity deposits and withdrawals from the contract.

### User Access
- Users can deposit and withdraw funds from their wallets to the bank (smart contract) at any time.
- Users can grant access permissions to specific wallet addresses. These permitted wallets can deposit and withdraw funds on behalf of the user who granted them access.

### CoinFlip Game
- Users can place a bet to play the CoinFlip game.
- By clicking the play button, the bet amount is deducted from the user's wallet and a function is executed in the smart contract.
- The result is determined as heads or tails.
  - If the user guesses correctly, they win twice the bet amount, which is withdrawn from the liquidity pool in the contract.
  - If the user loses, the bet amount is directly added to the liquidity pool.

## Usage

### Owner Access
1. **Deposit liquidity:**
   - Go to the 'Owner Access' section in the interface.
   - Enter the amount you want to deposit and confirm the transaction.
2. **Withdraw liquidity:**
   - Go to the 'Owner Access' section in the interface.
   - Enter the amount you want to withdraw and confirm the transaction.

### User Access
1. **Deposit funds:**
   - Go to the 'User Access' section in the interface.
   - Enter the amount you want to deposit and confirm the transaction.
2. **Withdraw funds:**
   - Go to the 'User Access' section in the interface.
   - Enter the amount you want to withdraw and confirm the transaction.
3. **Grant access permission:**
   - Go to the 'User Access' section in the interface.
   - Enter the wallet address you want to grant access to and confirm the transaction.

### CoinFlip Game
1. **Place a bet and play:**
   - Go to the CoinFlip game section.
   - Enter the bet amount and select your guess (heads or tails).
   - Click the 'Play' button to start the game.

## Acknowledgments

I would like to express my gratitude to the following individuals for their support and contributions:
- [**Gökay Şahin**](https://github.com/katex35) - For providing valuable assistance and working on the frontend development of this project.
