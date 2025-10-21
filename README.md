# IPFS File Uploader

A simple full-stack application that allows users to pay in **RBTC** to upload files to **IPFS/Pinata**.  
The goal is to demonstrate how **Rootstock** can enable BTC-backed payments while leveraging decentralized storage for practical use cases.


### TODO
- [x] Setup React client to accept file
- [ ] Connect to IPFS upload endpoint  
- [ ] Add Node.js API for IPFS + payment verification  
- [ ] Connect to Rootstock for BTC-backed payments
- [ ] Add wallet connection (e.g., MetaMask) 

## Client
Made with React. Lets users select a file, preview its metadata (name, size, MIME type), and prepare for upload to IPFS.

**Tech Stack:** React + Vite + TypeScript

### Features
- File input with preview
- File size validation (max 2 MB)
- Disabled upload button until valid file chosen

### How to run
```bash
# Install dependencies
npm install

# Run development server
npm run dev

