import { NFTStorage, File, Blob } from 'nft.storage';
const NFT_STORAGE_TOKEN = process.env['DEV_ORIGIN']

const client = new NFTStorage({ token: NFT_STORAGE_TOKEN })