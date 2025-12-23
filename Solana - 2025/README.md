# XmasCoin Solana Fee Claimer

This service claims pump.fun / pump.swap creator fees for a specific mint and
redistributes WSOL proceeds to eligible holders. It also exposes a small HTTP
API for distribution totals and recent transactions.

## What it does
- Claims creator fees (pump.fun or pump.swap depending on bonding status).
- Keeps a small SOL reserve before distributing.
- Distributes to eligible holders based on token ownership.
- Persists distribution totals and exposes them via HTTP endpoints.

## Requirements
- Node.js 18+ (or newer).
- A funded Solana keypair with the required authority.
- Environment variables: `PRIVATE_KEY` and optionally `RPC_ENDPOINT`.

## Setup
1) Install dependencies:
   - `npm install`
2) Create a `.env` file (example below).
3) Run the service:
   - `npm run start`

Example `.env`:
```
PRIVATE_KEY=BASE58_ENCODED_SECRET_KEY
RPC_ENDPOINT=https://your-solana-rpc.example
```

## API Endpoints
- `GET /total-distributed-sol` (port 3333)
  - Returns total distributed SOL as a number.
- `GET /distribution-txs` (port 3333)
  - Returns full list of distribution transactions.
- `GET /distribution-txs` (port 4444)
  - Returns last 200 distribution txs + summary totals.

## Files
- `main.js`: Entrypoint. Starts API servers and scheduler loop.
- `config.js`: RPC, keypair, and program IDs.
- `claim.js`: Claim flow for pump.fun / pump.swap.
- `distribution.js`: Distribution logic and batching.
- `holders.js`: Eligible holder discovery and balances.
- `state.js`: Persistent totals in `total_distributed_sol.json`.

## Notes
- The scheduler interval is set to ~2m58s.
- The totals file is stored in this folder.
