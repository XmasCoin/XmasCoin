const { PublicKey } = require("@solana/web3.js");
const { PUMP_PROGRAM_ID, PUMP_SWAP_PROGRAM_ID } = require("./config");

function creatorVaultPdaPumpFun(creator) {
  const [creatorVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), creator.toBuffer()],
    PUMP_PROGRAM_ID
  );
  return creatorVault;
}

function creatorVaultPdaPumpSwap(creator) {
  const [creatorVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator_vault"), creator.toBuffer()],
    PUMP_SWAP_PROGRAM_ID
  );
  return creatorVault;
}

module.exports = { creatorVaultPdaPumpFun, creatorVaultPdaPumpSwap };
