# Invoices App using Mina Protocol
## Overview
This is a decentralized application (dApp) for managing invoices built on the Mina Protocol. It leverages zero-knowledge proofs for privacy and security.

For simplicity of PoC Invoices in this app consist of five main fields:
- From: PublicKey
- To: PublicKey
- Amount: UInt32
- Settled: Boolean
- MetadataHash: Field

## Vision
The core idea behind this project was to build an invoices system that is generic to store any type of invoices. And allow multiple parties to operate of invoices. One use case is to prove the validity of invoices to put them up as security for obtaining a debt. And there any many such usecases.

Invoices include TAX related PII. And are ideal candidates for a zk application which can prove validity of their invoice without revealing their PII.

## Key Highlights of PoC

- Use a worker based setup so that the main thread is never blocked.
- Use actions and reducer based model to create, settle and commit invoices.
- Utilize a cached SmartContract to reduce compile time on the browser.
- Lay foundational work to store the data offchain.
- Unit tests for the smart contract app

### Utilise cached/precompiled data for a SmartContract

Ref: https://discord.com/channels/484437221055922177/1171938451193593856/1171938451193593856

Without using cached data, the ZkApp was taking ~7 mins on i5 Macbook Pro 16GB machine. After setting up the cache, it was reduced to only ~40 seconds.

#### Steps:
1. Run and compile the smart contract locally to get the cache files.
2. Serve the cache files as static content with the app
3. Maintain a list of generated files on the client to fetch those files before starting compilation.
4. Use a modified fork of nodejs cache filesystem to service the fetched files in sync manner to the compiler.

For more details on this.. check `./ui/public/nftcache` and `./ui/src/worker.ts`

## Next Step

- Use ZkProgram and Recursive proofs to increase scalability. We don't want the users to wait for a block to be committed on chain before they are allowed to operate on their invoice.
- Build off-chain data storage mechanism to store the list of invoices and the merkle tree
- Introduce access control rules to only allow the owners of the invoice to operate on it.
- And much more.

## Scripts

From contracts directory
- Unit Tests: `npm run test`
- Interact Locally: `npm run build && node ./build/src/interact-local.js`
- Interact on cahin: `npm run build && node ./build/src/interact.js`

From UI directory
- Run locally: `npm run dev`