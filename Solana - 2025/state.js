const fs = require("fs");
const BN = require("bn.js");
const { TOTAL_FILE } = require("./config");

let totalDistributedSol = new BN(0);
let distributionTxs = [];

function loadState() {
  if (!fs.existsSync(TOTAL_FILE)) {
    console.error("File not found:", TOTAL_FILE);
    return;
  }

  try {
    const data = fs.readFileSync(TOTAL_FILE, "utf8");
    const json = JSON.parse(data);
    totalDistributedSol = new BN(json.totalDistributedLamports);
    distributionTxs = json.distributionTxs || [];
    console.log(`Loaded cumulative total: ${totalDistributedSol.toString()} lamports`);
    console.log(`Loaded ${distributionTxs.length} distribution txs`);
  } catch (err) {
    console.error("Error loading total from file:", err);
  }
}

function saveState() {
  try {
    const data = JSON.stringify(
      {
        totalDistributedLamports: totalDistributedSol.toString(),
        distributionTxs,
      },
      null,
      2
    );
    fs.writeFileSync(TOTAL_FILE, data, "utf8");
    console.log(`Saved cumulative total to file: ${totalDistributedSol.toString()} lamports`);
  } catch (err) {
    console.error("Error saving total to file:", err);
  }
}

function getTotalDistributedSol() {
  return totalDistributedSol;
}

function getDistributionTxs() {
  return distributionTxs;
}

function addDistributionTx(tx) {
  distributionTxs.push(tx);
}

function addDistributedSol(amount) {
  totalDistributedSol = totalDistributedSol.add(amount);
}

loadState();

module.exports = {
  getTotalDistributedSol,
  getDistributionTxs,
  addDistributionTx,
  addDistributedSol,
  saveState,
};
