# Contracts

Smart contracts for the Rootstock IPFS uploader live in this package.

## Stack

- Solidity
- Hardhat
- Ethers.js

## What it does

The `PayForUpload` contract accepts RBTC payments for uploads and lets the contract owner withdraw collected funds.

## Network

This project is configured for `Rootstock Testnet`, not Sepolia.

Configured network:

- `rootstock-testnet`
- RPC URL: `https://public-node.testnet.rsk.co`
- Chain ID: `31`

See [`hardhat.config.js`](/Users/jheikhei/OpenSource/IPFS_rsk/contracts/hardhat.config.js).

## Environment Variables

Create `contracts/.env` with:

```bash
PRIVATE_KEY=your_wallet_private_key
```

## Install

```bash
npm install
```

## Common Commands

Compile the contract:

```bash
npx hardhat compile
```

Run tests:

```bash
npm test
```

Deploy to Rootstock Testnet:

```bash
npx hardhat run scripts/deploy.js --network rootstock-testnet
```

## Deployment

The deploy script sets the upload fee to `0.00001` RBTC.

See [`scripts/deploy.js`](/Users/jheikhei/OpenSource/IPFS_rsk/contracts/scripts/deploy.js).

When verifying the deployed contract, use constructor argument:

```bash
10000000000000
```

That value is `0.00001` RBTC in wei.

## Contract Summary

The main contract is [`contracts/PayForUpload.sol`](/Users/jheikhei/OpenSource/IPFS_rsk/contracts/contracts/PayForUpload.sol).

Key behavior:

- `payForUpload(bytes32 uploadId)` accepts payments at or above `uploadFee`
- `withdraw()` can only be called by the owner
