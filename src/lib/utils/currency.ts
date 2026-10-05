export function formatINR(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return (
    "₹" +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function roundTo2(num: number): number {
  return Math.round(num * 100) / 100;
}
