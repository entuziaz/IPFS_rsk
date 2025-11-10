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
VITE_API_URL=your_server_url
VITE_CONTRACT_ADDRESS=deployed_and_verified_contract_address
VITE_UPLOAD_PRICE=0.001


### How to run
```bash
# Install dependencies
npm install

# Run development server
npm run dev


## Server
Made with Node.js and Express. Handles file uploads to Pinata.

**Tech Stack:** Node.js + Express + Multa + PinataSDK + TypeScript

### Features
- TBD

### Environment Variables (`server/.env`)
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=your_gateway_url
FRONTEND_URL=your_client_url
PORT=4000

### Run Server
cd server
npm install
npx ts-node src/app.ts

