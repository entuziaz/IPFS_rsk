# IPFS File Uploader

A simple full-stack application that allows users to pay in **RBTC** to upload files to **IPFS/Pinata**.  
The goal is to demonstrate how **Rootstock** can enable BTC-backed payments while leveraging decentralized storage for practical use cases.


### TODO
- [x] Setup React client to accept file
- [x] Connect to IPFS-Pinata upload SDK  
- [x] Add Node.js API for IPFS + payment verification  
- [x] Connect to Rootstock for BTC-backed payments
- [x] Add wallet connection (e.g., MetaMask) 

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

### How to run


**Install dependencies**
```bash
npm install
```
**Run development server**
```bash
npm run dev
```

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

### Run Server
```bash
cd server
npm install
npx ts-node src/app.ts
```

## Contracts
Made with Solidity and deployed on Rootstock Testnet. Allows paying for uploads.

**Tech Stack:** Solidity + Hardhat 

### Environment Variables (`server/.env`)
```bash
PINATA_JWT=your_pinata_jwt
```

# Running Commands
```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network rootstock_testnet
```

> You can verify contracts by following the instructions
in the [Rootstock docs](https://dev.rootstock.io/developers/quickstart/remix/#verifying-the-contract-on-rootstock-explorer).

### Project Status
End-to-end workflow working:
- ✅ Select file on UI
- ✅ Pay on-chain 
- ✅ Confirm tx 
- ✅ Upload to IPFS 
- ✅ Receive CID 
- ✅ View file on gateway 