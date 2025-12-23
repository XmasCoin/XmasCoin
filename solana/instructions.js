const { TransactionInstruction, SystemProgram } = require("@solana/web3.js");
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
} = require("@solana/spl-token");
const {
  WSOL,
  PUMP_PROGRAM_ID,
  PUMP_SWAP_PROGRAM_ID,
  PUMP_EVENT_AUTHORITY,
  PUMPSWAP_EVENT_AUTHORITY,
} = require("./config");
const { creatorVaultPdaPumpFun, creatorVaultPdaPumpSwap } = require("./pda");

function buildCollectCreatorFeeIxPumpFun(creator) {
  const creatorVault = creatorVaultPdaPumpFun(creator);
  const data = Buffer.from("1416567bc61cdb84", "hex");

  return new TransactionInstruction({
    programId: PUMP_PROGRAM_ID,
    keys: [
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: creatorVault, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: PUMP_EVENT_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });
}

async function buildCollectCreatorFeeIxPumpSwap(creator) {
  const creatorVault = creatorVaultPdaPumpSwap(creator);
  const atacreatorVault = await getAssociatedTokenAddress(WSOL, creatorVault, true);
  const data = Buffer.from("a039592ab58b2b42", "hex");
  const ataWSOL = await getAssociatedTokenAddress(WSOL, creator);

  const createAtaTx = createAssociatedTokenAccountIdempotentInstruction(
    creator,
    ataWSOL,
    creator,
    WSOL,
    TOKEN_PROGRAM_ID
  );

  const claimTx = new TransactionInstruction({
    programId: PUMP_SWAP_PROGRAM_ID,
    keys: [
      { pubkey: WSOL, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: creatorVault, isSigner: false, isWritable: true },
      { pubkey: atacreatorVault, isSigner: false, isWritable: true },
      { pubkey: ataWSOL, isSigner: false, isWritable: true },
      { pubkey: PUMPSWAP_EVENT_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: PUMP_SWAP_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });

  return [createAtaTx, claimTx];
}

module.exports = { buildCollectCreatorFeeIxPumpFun, buildCollectCreatorFeeIxPumpSwap };
