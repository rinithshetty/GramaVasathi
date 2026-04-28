/**
 * Helpers for working with check-in/check-out date ranges.
 * checkInDate is inclusive, checkOutDate is exclusive (the day the guest leaves).
 * The list of "occupied nights" therefore runs [checkIn, checkIn+1, ..., checkOut-1].
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseISODate(s: string): Date {
  // Treat "YYYY-MM-DD" as UTC midnight to avoid TZ drift.
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function formatISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseISODate(checkIn).getTime();
  const b = parseISODate(checkOut).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

export function expandNights(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  const start = parseISODate(checkIn);
  const end = parseISODate(checkOut);
  for (let t = start.getTime(); t < end.getTime(); t += MS_PER_DAY) {
    out.push(formatISODate(new Date(t)));
  }
  return out;
}

export function rangesOverlap(
  aIn: string,
  aOut: string,
  bIn: string,
  bOut: string,
): boolean {
  // Two half-open ranges [aIn, aOut) and [bIn, bOut) overlap when aIn < bOut and bIn < aOut.
  return aIn < bOut && bIn < aOut;
}
