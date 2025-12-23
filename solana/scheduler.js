const { isTokenBonded } = require("./bonding");
const { claimPumpFunFees, claimPumpSwapFees } = require("./claim");
const { SPECIFIC_MINT } = require("./config");

async function main() {
  const startTime = new Date().toISOString();
  console.log(`Starting main execution at ${startTime}`);
  try {
    const completed = await isTokenBonded(SPECIFIC_MINT.toBase58());
    if (!completed) {
      console.log("Start claiming PUMP.FUN fees");
      await claimPumpFunFees();
    } else {
      console.log("Start claiming PUMP.SWAP fees");
      await claimPumpSwapFees();
    }

    console.log(`Main execution completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`Error in main at ${new Date().toISOString()}:`, error);
  }
}

function startScheduler() {
  async function runLoop() {
    try {
      await main();
    } catch (err) {
      console.error("Error in scheduled task:", err);
    }

    setTimeout(runLoop, 2 * 58 * 1000);
  }

  runLoop();
}

module.exports = { main, startScheduler };
