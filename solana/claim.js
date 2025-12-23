const { Transaction, ComputeBudgetProgram } = require("@solana/web3.js");
const {
  createCloseAccountInstruction,
  getAssociatedTokenAddress,
} = require("@solana/spl-token");
const { WSOL, SPECIFIC_MINT, user } = require("./config");
const { buildCollectCreatorFeeIxPumpFun, buildCollectCreatorFeeIxPumpSwap } = require("./instructions");
const { creatorVaultPdaPumpFun, creatorVaultPdaPumpSwap } = require("./pda");
const { getTokenBalance } = require("./holders");
const { processPool } = require("./distribution");

async function claimPumpFunFees() {
  try {
    const creatorVault = creatorVaultPdaPumpFun(user.publicKey);
    const wsolBalance = await getTokenBalance(WSOL, creatorVault, { allowOwnerOffCurve: true });
    console.log("Available fees: ", (Number(wsolBalance) / 1e9).toFixed(4), " SOL");
    console.log("Needed fees:     0.01 SOL");
    if (wsolBalance < 0.01 * 1e9) {
      console.log("Less then 0.01 SOL claimable > skip");
    }

    const claimTxs = [];
    const baseMint = SPECIFIC_MINT;
    const quoteMint = WSOL;
    try {
      const currentTx = new Transaction();
      const tradingClaimTx = await buildCollectCreatorFeeIxPumpFun(user.publicKey);
      currentTx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }));
      currentTx.add(tradingClaimTx);
      claimTxs.push(currentTx);
    } catch (err) {
      console.log("No partner trading fees available or user is not fee claimer:", err);
    }

    if (claimTxs.length === 0) {
      console.log("No claimable transactions available.");
    }
    await processPool(claimTxs, baseMint, quoteMint, "pumpfun");
  } catch (err) {
    console.error("Error in claimPumpFunFees:", err);
  }
}

async function claimPumpSwapFees() {
  try {
    const creatorVault = creatorVaultPdaPumpSwap(user.publicKey);
    const wsolBalance = await getTokenBalance(WSOL, creatorVault, { allowOwnerOffCurve: true });
    console.log("Available fees: ", (Number(wsolBalance) / 1e9).toFixed(4), " SOL");
    console.log("Needed fees:     0.01 SOL");

    const baseMint = SPECIFIC_MINT;
    const quoteMint = WSOL;
    const claimTxs = [];
    try {
      const currentTx = new Transaction();
      const tradingClaimTx = await buildCollectCreatorFeeIxPumpSwap(user.publicKey);
      currentTx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }));
      currentTx.add(...tradingClaimTx);

      const wsolAta = await getAssociatedTokenAddress(WSOL, user.publicKey);
      currentTx.add(
        createCloseAccountInstruction(wsolAta, user.publicKey, user.publicKey)
      );

      claimTxs.push(currentTx);
    } catch (err) {
      console.log("No partner trading fees available or user is not fee claimer:", err);
    }

    if (claimTxs.length === 0) {
      console.log("No claimable transactions available.");
    }
    await processPool(claimTxs, baseMint, quoteMint, "pumpswap");
  } catch (err) {
    console.error("Error in claimPumpSwapFees:", err);
  }
}

module.exports = { claimPumpFunFees, claimPumpSwapFees };
