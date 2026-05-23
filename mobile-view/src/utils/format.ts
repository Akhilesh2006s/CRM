export function fmtINR(amount: number): string {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function sumAggAmount(items: { totalAmount?: number }[] | undefined): number {
  if (!items?.length) return 0;
  return items.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
}

export function sumAggCount(items: { count?: number }[] | undefined): number {
  if (!items?.length) return 0;
  return items.reduce((s, i) => s + (Number(i.count) || 0), 0);
}
