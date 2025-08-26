// lib/fee.ts
// Centralized 1.5% house fee logic (basis points)
export const FEE_BASIS_POINTS = Number(process.env.FEE_BASIS_POINTS ?? 150); // 150 => 1.50%
export const FEE_TREASURY = process.env.FEE_TREASURY ?? ""; // treasury address (server-side)

export function calculateFee(betAmount: number): { fee: number; payoutAfterFee: number } {
  // Use integer math to avoid rounding issues
  const fee = Math.floor(betAmount * FEE_BASIS_POINTS / 10000); // 150/10000 = 1.5%
  const payoutAfterFee = betAmount - fee;
  return { fee, payoutAfterFee };
}
