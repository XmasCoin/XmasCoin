const BN = require("bn.js");
const { PublicKey } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } = require("@solana/spl-token");
const {
  connection,
  TOKEN_2022_PROGRAM_ID,
  MIN_NEEDED_PERCENTAGE,
  user,
} = require("./config");

function decodeTokenAccount(account) {
  const data = account.data;
  const amount = data.readBigUInt64LE(64);
  const owner = new PublicKey(data.slice(32, 64));
  return { amount, owner };
}

async function getTokenBalance(
  mint,
  owner,
  { allowOwnerOffCurve = false, programId = TOKEN_PROGRAM_ID } = {}
) {
  try {
    const ata = await getAssociatedTokenAddress(mint, owner, allowOwnerOffCurve, programId);
    const balance = await connection.getTokenAccountBalance(ata);
    return new BN(balance.value.amount);
  } catch (err) {
    try {
      const parsed = await connection.getParsedTokenAccountsByOwner(owner, { mint, programId });
      const maxAmount = parsed.value.reduce((acc, { account }) => {
        const amt = new BN(account.data.parsed.info.tokenAmount.amount || "0");
        return amt.gt(acc) ? amt : acc;
      }, new BN(0));
      return maxAmount;
    } catch (innerErr) {
      console.error("getTokenBalance failed:", innerErr?.message || innerErr);
      return new BN(0);
    }
  }
}

async function getSolBalance(owner) {
  return new BN((await connection.getBalance(owner)).toString());
}

async function getEligibleHolders(mint) {
  const filters = [{ memcmp: { offset: 0, bytes: mint.toBase58() } }];
  const scaledPercentage = Math.floor(MIN_NEEDED_PERCENTAGE * 1e6);
  const thresholdRaw = BigInt(10_000_000) * BigInt(scaledPercentage);
  console.log(`Needed tokens: ${thresholdRaw.toString()}`);
  const threshold = new BN(thresholdRaw.toString());

  try {
    const accounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, { filters });
    const holderMap = new Map();
    for (const { account } of accounts) {
      const { amount, owner } = decodeTokenAccount(account);
      if (amount === 0n) {
        continue;
      }

      const ownerStr = owner.toBase58();
      const current = holderMap.get(ownerStr) || new BN(0);
      holderMap.set(ownerStr, current.add(new BN(amount.toString())));
    }

    const userKey = user.publicKey.toBase58();
    const eligible = Array.from(holderMap.entries())
      .filter(
        ([owner, amount]) =>
          owner !== userKey &&
          amount.gte(threshold) &&
          owner !== "HFzUzvzS8d3zeaGC8x8XRWSasSYb8218g9hM3zxPPhEo"
      )
      .sort((a, b) => b[1].cmp(a[1]));
    const eligibleHolders = eligible.slice(1);
    const totalEligible = eligibleHolders.reduce((sum, [, amount]) => sum.add(amount), new BN(0));
    return { eligibleHolders, totalEligible };
  } catch (err) {
    console.error("Error fetching eligible holders:", err);
    return { eligibleHolders: [], totalEligible: new BN(0) };
  }
}

module.exports = { getTokenBalance, getSolBalance, getEligibleHolders };
