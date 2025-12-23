const express = require("express");
const { getTotalDistributedSol, getDistributionTxs } = require("./state");

function startApiServers({ port = 3333, summaryPort = 4444 } = {}) {
  const app = express();
  const summaryApp = express();

  app.get("/total-distributed-sol", (req, res) => {
    const totalSol = getTotalDistributedSol().toNumber() / 1e9;
    res.json({ totalDistributedSol: totalSol });
  });

  app.get("/distribution-txs", (req, res) => {
    const normalized = getDistributionTxs().map((tx) => ({
      transferHash: tx.transferHash || "",
      lamports: tx.lamports || "0",
      recipients: tx.recipients,
      timestamp: tx.timestamp,
    }));
    res.json({ distributionTxs: normalized });
  });

  summaryApp.get("/distribution-txs", (req, res) => {
    const distributionTxs = getDistributionTxs();
    const total = distributionTxs.length;
    const last200 = distributionTxs.slice(-200).reverse();
    const sums = distributionTxs.reduce(
      (acc, tx) => {
        const lamports = BigInt(tx.lamports ?? "0");
        acc.lamports += lamports;
        return acc;
      },
      { lamports: 0n }
    );
    const normalized = last200.map((tx) => ({
      transferHash: tx.transferHash || "",
      lamports: tx.lamports || "0",
      recipients: tx.recipients,
      timestamp: tx.timestamp,
    }));
    res.json({
      total,
      sumLamports: sums.lamports.toString(),
      distributionTxs: normalized,
    });
  });

  app.listen(port, () => {
    //console.log(`API server running on http://localhost:${port}`);
  });

  summaryApp.listen(summaryPort, () => {
    //console.log(`Summary API server running on http://localhost:${summaryPort}`);
  });

  return { app, summaryApp };
}

module.exports = { startApiServers };
