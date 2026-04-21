# Server

Express API for validating uploads and sending files to Pinata/IPFS.

## Stack

- Node.js
- Express
- TypeScript
- Multer
- Pinata SDK

## What it does

The server exposes an upload endpoint that:

- accepts multipart file uploads
- validates file size and inspects file bytes to confirm type
- verifies the payer's wallet signature
- verifies the matching on-chain `Paid` event on Rootstock
- redeems each payment proof only once
- throttles upload attempts per client IP
- sends baseline security headers with Helmet
- uploads valid files to Pinata
- returns the resulting CID and gateway URL

## Environment Variables

Create `server/.env` with:

```bash
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=your_gateway_domain
FRONTEND_URL=http://localhost:5173
ROOTSTOCK_RPC_URL=your_Rootstock_RPC_URL
CONTRACT_ADDRESS=your_deployed_contract_address
MIN_CONFIRMATIONS=1
UPLOAD_RATE_LIMIT_WINDOW_MS=60000
UPLOAD_RATE_LIMIT_MAX_REQUESTS=5
TRUST_PROXY=loopback
PORT=4000
```

Get your Rootstock RPC URL by following the steps on [Getting Started with the Rootstock RPC API](https://dev.rootstock.io/developers/rpc-api/rootstock/setup/).

Example gateway value:

```bash
PINATA_GATEWAY=fun-llama-300.mypinata.cloud
```

## Install

```bash
npm install
```

## Common Commands

Run the development server:

```bash
npx ts-node src/app.ts
```

By default, the API listens on `http://localhost:4000`.

Build TypeScript:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

## API

Upload endpoint:

```bash
POST /upload
```

By default, the server allows `5` upload attempts per IP every `60` seconds and returns `429 Too Many Requests` with `Retry-After` when the limit is exceeded.

Form fields:

- `file`: the uploaded file
- `uploadId`: client-generated upload identifier
- `txHash`: transaction hash returned by `payForUpload`
- `walletAddress`: address that submitted the payment transaction
- `signature`: signature over the upload authorization message

## Supported Upload Types

The server accepts:

- `image/png`
- `image/jpeg`
- `image/webp`
- `application/pdf`

Maximum file size is `2 MB`.

## Related Files

- App bootstrap: [`src/app.ts`](/Users/jheikhei/OpenSource/IPFS_rsk/server/src/app.ts)
- Upload service: [`src/services/upload_service.ts`](/Users/jheikhei/OpenSource/IPFS_rsk/server/src/services/upload_service.ts)
- Upload controller: [`src/controllers/upload_controller.ts`](/Users/jheikhei/OpenSource/IPFS_rsk/server/src/controllers/upload_controller.ts)
