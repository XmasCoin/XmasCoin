const BN = require("bn.js");
const {
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
  VersionedTransaction,
  TransactionMessage,
} = require("@solana/web3.js");
const { connection, user, WSOL } = require("./config");
const { getSolBalance, getEligibleHolders } = require("./holders");
const { addDistributionTx, addDistributedSol, saveState } = require("./state");
const { chunkArray, sleep } = require("./utils");

async function getTxFee(txHash) {
  try {
    const tx = await connection.getTransaction(txHash, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    return new BN(tx?.meta?.fee || 0);
  } catch (err) {
    console.error("Error fetching tx fee:", err);
    return new BN(0);
  }
}

async function sendBatchTransactions(signer, instructions, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

      const messageInstructions = [
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
        ...instructions,
      ];

      const message = new TransactionMessage({
        payerKey: signer.publicKey,
        recentBlockhash: blockhash,
        instructions: messageInstructions,
      }).compileToV0Message();

      const tx = new VersionedTransaction(message);
      tx.sign([signer]);

      const txId = await connection.sendTransaction(tx, { skipPreflight: true });

      await connection.confirmTransaction(
        { blockhash, lastValidBlockHeight, signature: txId },
        "confirmed"
      );

      console.log(`Batch sent. TxID: ${txId}`);
      return txId;
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err?.message || err);

      if (
        err?.message?.includes("block height exceeded") ||
        err?.name === "TransactionExpiredBlockheightExceededError"
      ) {
        attempt += 1;
        await sleep(500);
        continue;
      }

      throw err;
    }
  }

  throw new Error(`Transaction failed after ${maxRetries} attempts.`);
}

async function processPool(claimTxs, baseMint, quoteMint, poolType = "dbc") {
  if (!quoteMint.equals(WSOL)) {
    console.log("Quote not WSOL, skipping distribution for this pool.");
    return;
  }

  console.log(
    `Processing pool: ${poolType.toUpperCase()}, BaseMint=${baseMint.toBase58()}, QuoteMint=${quoteMint.toBase58()}`
  );

  let claimFeeTotal = new BN(0);
  for (const [index, tx] of claimTxs.entries()) {
    try {
      console.log(`Executing claim transaction ${index + 1}/${claimTxs.length}`);
      const txHash = await sendAndConfirmTransaction(connection, tx, [user], {
        commitment: "confirmed",
      });
      console.log(`Claim tx ${index + 1} successful: https://solscan.io/tx/${txHash}`);
      claimFeeTotal = claimFeeTotal.add(await getTxFee(txHash));
    } catch (err) {
      console.error(`Error in claim transaction ${index + 1}:`, err);
    }
  }

  if (!claimFeeTotal.isZero()) {
    console.log(`Total claim fees paid: ${claimFeeTotal.toString()} lamports`);
  }

  await sleep(1500);

  const currentSolBalance = await getSolBalance(user.publicKey);
  const keepBack = new BN(0.08 * 1e9);
  const minBuy = new BN(0.01 * 1e9);

  if (!currentSolBalance.gt(keepBack)) {
    console.log(
      `Pot (${currentSolBalance.toString()} lamports) is less than or equal to 0.05 SOL, no distribution.`
    );
    return;
  }

  const distributablePot = currentSolBalance.sub(keepBack);

  if (distributablePot.lt(minBuy)) {
    console.log(
      `Distributable amount ${distributablePot.toString()} lamports below minimum ${minBuy.toString()}, skipping swap.`
    );
    return;
  }

  console.log(
    `Distributable pot: ${distributablePot.toString()} lamports (${distributablePot.toNumber() / 1e9} SOL)`
  );

  const { eligibleHolders, totalEligible } = await getEligibleHolders(baseMint);
  if (eligibleHolders.length === 0 || totalEligible.isZero()) {
    console.log("No eligible holders found; keeping proceeds.");
    return;
  }

  const holderPool = distributablePot;
  const shareDetails = eligibleHolders
    .map(([ownerStr, amount]) => {
      const share = holderPool.mul(amount).div(totalEligible);
      return { ownerStr, amount, share };
    })
    .filter(({ share }) => share.gt(new BN(0)));

  if (shareDetails.length === 0) {
    console.log("Calculated shares are zero for all holders; skipping holder distribution.");
  }

  console.log(shareDetails);
  const assignedTotal = shareDetails.reduce((sum, { share }) => sum.add(share), new BN(0));
  const holderRemainder = holderPool.sub(assignedTotal);
  if (holderRemainder.gt(new BN(0)) && shareDetails.length > 0) {
    shareDetails[0].share = shareDetails[0].share.add(holderRemainder);
  }
  const holderDistributed = shareDetails.reduce((sum, { share }) => sum.add(share), new BN(0));

  for (const batch of chunkArray(shareDetails, 10)) {
    const transferInstructions = [];
    let batchLamports = new BN(0);

    for (const detail of batch) {
      const toPubkey = new PublicKey(detail.ownerStr);
      const lamports = Number(detail.share.toString());
      transferInstructions.push(
        SystemProgram.transfer({
          fromPubkey: user.publicKey,
          toPubkey,
          lamports,
        })
      );
      batchLamports = batchLamports.add(detail.share);
    }

    const txId = await sendBatchTransactions(user, transferInstructions);
    addDistributionTx({
      transferHash: txId,
      lamports: batchLamports.toString(),
      recipients: batch.length,
      timestamp: new Date().toISOString(),
    });
    await sleep(300);
  }

  addDistributedSol(distributablePot);
  saveState();

  console.log(`Distributed ${holderDistributed.toString()} lamports across ${shareDetails.length} holders.`);
  console.log(`Remaining SOL balance: ${(await getSolBalance(user.publicKey)).toNumber() / 1e9} SOL`);
}

module.exports = { processPool };
