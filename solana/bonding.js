const BufferLayout = require("buffer-layout");
const { PublicKey } = require("@solana/web3.js");
const { getAssociatedTokenAddress } = require("@solana/spl-token");
const { connection, PUMP_PROGRAM_ID } = require("./config");

const u64 = (property) => BufferLayout.blob(8, property);
const bool = (property) => BufferLayout.u8(property);

const bondingCurveLayout = BufferLayout.struct([
  BufferLayout.blob(8, "padding"),
  u64("virtualTokenReserves"),
  u64("virtualSolReserves"),
  u64("realTokenReserves"),
  u64("realSolReserves"),
  u64("tokenTotalSupply"),
  bool("complete"),
  BufferLayout.blob(32, "creator"),
]);

function parseBondingCurveData(data) {
  return bondingCurveLayout.decode(data);
}

async function deriveBondingCurveAccounts(mintStr) {
  try {
    const mint = new PublicKey(mintStr);
    const [bondingCurve] = await PublicKey.findProgramAddress(
      [Buffer.from("bonding-curve"), mint.toBuffer()],
      PUMP_PROGRAM_ID
    );

    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurve,
      true
    );

    return { bondingCurve, associatedBondingCurve };
  } catch (err) {
    console.error("Error deriving bonding curve accounts:", err);
    return { bondingCurve: null, associatedBondingCurve: null };
  }
}

async function isTokenBonded(mintStr) {
  const { bondingCurve } = await deriveBondingCurveAccounts(mintStr);
  if (!bondingCurve) return false;

  try {
    const accountInfo = await connection.getAccountInfo(bondingCurve);
    if (!accountInfo) return false;

    const parsed = parseBondingCurveData(accountInfo.data);
    return parsed.complete;
  } catch (err) {
    console.error("Error fetching bonding curve account:", err);
    return false;
  }
}

module.exports = { deriveBondingCurveAccounts, isTokenBonded };
