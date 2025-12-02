# IPFS File Uploader

A simple full-stack application that allows users to pay in **RBTC** to upload files to **IPFS/Pinata**.  
The goal is to demonstrate how **Rootstock** can enable BTC-backed payments while leveraging decentralized storage for practical use cases.


### TODO
- [x] Setup React client to accept file
- [x] Connect to IPFS-Pinata upload SDK  
- [x] Add Node.js API for IPFS + payment verification  
- [x] Connect to Rootstock for BTC-backed payments
- [x] Add wallet connection (e.g., MetaMask) 


## Contracts
Made with Solidity and deployed on Rootstock Testnet. Allows paying for uploads.

**Tech Stack:** Solidity + Hardhat 

### Features
- Accept payments for uploads
- Owner-only withdrawal

### Environment Variables (`contracts/.env`)
```bash
PRIVATE_KEY=Your_PRIVATE_KEY
```

### Running Commands

To compile the contract:
```bash
npx hardhat compile
```
To deploy the contract to the testnet:
```bash
npx hardhat run scripts/deploy.js --network rootstock-testnet
```

> You can verify contracts by following the instructions
in the [Rootstock docs](https://dev.rootstock.io/developers/quickstart/remix/#verifying-the-contract-on-rootstock-explorer). Supply the maxFee, `1000000000000000` as the constructor argument.


## Server
Made with Node.js and Express. Handles file uploads to Pinata.

**Tech Stack:** Node.js + Express + Pinata SDK + Multer (multipart parser) + TypeScript

### Features
- File validation: MIME type + max size (2MB)
- Upload file buffer via Pinata SDK

### Environment Variables (`server/.env`)
```bash
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=your_gateway_url
FRONTEND_URL=your_client_url
PORT=4000
```

### Running Commands
```bash
cd server
npm install
npx ts-node src/app.ts
```


## Client
Made with React. Lets users select a file, preview its metadata (name, size, MIME type), and prepare for upload to IPFS.

**Tech Stack:** React + Vite + TypeScript

### Features
- File input with preview
- File size validation (max 2 MB)
- Disabled upload button until valid file chosen

### Environment Variables (`client/.env`)
```bash
VITE_API_URL=your_server_url
VITE_CONTRACT_ADDRESS=deployed_and_verified_contract_address
VITE_UPLOAD_PRICE=0.001
```

### Running Commands

1. Install dependencies:
```bash
npm install
```
2. Run development server:
```bash
npm run dev
```

### Steps to interact with the running app:

 1. [Connect MetaMask to Rootstock testnet](https://dev.rootstock.io/dev-tools/wallets/metamask/) and pick an account with test RBTC
 2. Select a file (≤ 2 MB).
 3. Click Pay (then go through the MetaMask prompt).
 4. Wait for transaction to confirm (UI shows tx hash and status).
 5. Click Upload (enabled after payment) to POST file to server.
 6. Receive CID and click gateway link to view.



## Project Status
End-to-end workflow working:
- ✅ Select file on UI
- ✅ Pay on-chain 
- ✅ Confirm tx 
- ✅ Upload to IPFS 
- ✅ Receive CID 
- ✅ View file on gateway 
