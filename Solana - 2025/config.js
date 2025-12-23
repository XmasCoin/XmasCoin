const path = require("path");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const bs58 = require("bs58");

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "";
const COMMITMENT = "confirmed";

function loadKeypairFromEnv() {
  if (!process.env.PRIVATE_KEY || typeof process.env.PRIVATE_KEY !== "string") {
    throw new Error("Missing PRIVATE_KEY in environment (.env). Expected base58-encoded string.");
  }
  const secretKey = Uint8Array.from(bs58.decode(process.env.PRIVATE_KEY.trim()));
  return Keypair.fromSecretKey(secretKey);
}

const connection = new Connection(RPC_ENDPOINT, COMMITMENT);
const user = loadKeypairFromEnv();

const WSOL = new PublicKey("So11111111111111111111111111111111111111112");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const PUMP_SWAP_PROGRAM_ID = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const PUMP_EVENT_AUTHORITY = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
const PUMPSWAP_EVENT_AUTHORITY = new PublicKey("GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR");

const SPECIFIC_MINT = new PublicKey("AkY2Z8F6NfvamwSMBJgVrKJKLhKxFfm5hAqzqHPCpump");
const MIN_NEEDED_PERCENTAGE = 0.05;

const TOTAL_FILE = path.join(__dirname, "total_distributed_sol.json");

module.exports = {
  connection,
  user,
  WSOL,
  TOKEN_2022_PROGRAM_ID,
  PUMP_PROGRAM_ID,
  PUMP_SWAP_PROGRAM_ID,
  PUMP_EVENT_AUTHORITY,
  PUMPSWAP_EVENT_AUTHORITY,
  SPECIFIC_MINT,
  MIN_NEEDED_PERCENTAGE,
  TOTAL_FILE,
};
