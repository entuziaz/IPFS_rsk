# Client

React frontend for the Rootstock IPFS uploader.

## Stack

- React
- TypeScript
- Vite
- Ethers.js

## What it does

The client lets a user:

- connect MetaMask
- switch to Rootstock Testnet
- pay the upload fee in RBTC
- upload a supported file after payment
- open the uploaded file from the Pinata gateway

## Environment Variables

Create `client/.env` with:

```bash
VITE_API_URL=your_server_url
VITE_CONTRACT_ADDRESS=deployed_contract_address
VITE_UPLOAD_PRICE=0.00001
```

Important:

- `VITE_UPLOAD_PRICE` must match the contract's on-chain `uploadFee`
- after changing any `VITE_*` variable, restart the Vite dev server

## Install

```bash
npm install
```

## Common Commands

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

## Wallet Requirements

Use MetaMask on `Rootstock Testnet` with test RBTC.

If the wallet is on the wrong network, payment is blocked until the user switches to chain ID `31`.

The frontend dev server normally runs on `http://localhost:5173`, while the API server runs on `http://localhost:4000`.

## Supported Upload Types

The UI allows:

- `.png`
- `.jpg`
- `.jpeg`
- `.webp`
- `.pdf`

Files must be `2 MB` or smaller.

## Related Files

- App entry: [`src/App.tsx`](/Users/jheikhei/OpenSource/IPFS_rsk/client/src/App.tsx)
- Contract ABI: [`src/abi/PayForUpload.json`](/Users/jheikhei/OpenSource/IPFS_rsk/client/src/abi/PayForUpload.json)
