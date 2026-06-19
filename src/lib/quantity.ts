// Smarter quantity merge: attempts to sum if units match and numeric parts parseable
export function mergeQuantities(a: string | null | undefined, b: string | null | undefined): string | null {
  const aStr = (a ?? "").trim();
  const bStr = (b ?? "").trim();
  if (!aStr && !bStr) return null;
  if (!aStr) return bStr;
  if (!bStr) return aStr;
  const [aNum, ...aUnit] = aStr.split(/\s+/);
  const [bNum, ...bUnit] = bStr.split(/\s+/);
  const aVal = parseNumberLike(aNum);
  const bVal = parseNumberLike(bNum);
  const unitA = aUnit.join(" ").toLowerCase();
  const unitB = bUnit.join(" ").toLowerCase();
  if (!isNaN(aVal) && !isNaN(bVal) && unitA === unitB) {
    const sum = aVal + bVal;
    return `${roundSmart(sum)}${unitA ? ` ${unitA}` : ""}`.trim();
  }
  // Fallback concat
  return `${aStr} + ${bStr}`;
}

export function parseNumberLike(s: string): number {
  if (!s) return NaN;
  if (s.includes("/")) {
    const [n, d] = s.split("/").map(Number);
    if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
  }
  const n = Number(s);
  return n;
}

export function roundSmart(n: number): string {
  const quarter = Math.round(n * 4) / 4;
  if (Math.abs(quarter - Math.round(quarter)) < 1e-6) return String(Math.round(quarter));
  if (Math.abs(quarter * 2 - Math.round(quarter * 2)) < 1e-6) return `${Math.round(quarter * 2)}/2`;
  if (Math.abs(quarter * 4 - Math.round(quarter * 4)) < 1e-6) return `${Math.round(quarter * 4)}/4`;
  return n.toFixed(2);
}
