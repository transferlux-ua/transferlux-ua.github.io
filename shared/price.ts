/* TransferLux tariff.
   Adult ticket: 9 EUR per 100 km of real road distance + 20 EUR fixed
   (approved by the owner on 2026-11-22, replaces 10 EUR + 25 EUR).
   Child 0 to 14 years inclusive: 50% of the adult ticket.
   All money is calculated in euro cents to avoid rounding drift. */

export const TARIFF = { perHundredKm: 9, fixed: 20, childDiscount: 0.5, childMaxAge: 14 };

export interface Quote {
  km: number;
  adultCents: number;
  childCents: number;
  adults: number;
  children: number;
  totalCents: number;
}

export function quote(km: number, adults: number, children: number): Quote {
  if (!(km > 0)) throw new Error("distance must be positive");
  const adultCents = Math.round((km / 100) * TARIFF.perHundredKm * 100 + TARIFF.fixed * 100);
  const childCents = Math.round(adultCents * TARIFF.childDiscount);
  const a = Math.max(0, Math.floor(adults));
  const c = Math.max(0, Math.floor(children));
  return { km, adultCents, childCents, adults: a, children: c, totalCents: a * adultCents + c * childCents };
}

/** UAH from euro cents, rounded to whole hryvnia. */
export function toUah(cents: number, rate: number): number {
  return Math.round((cents / 100) * rate);
}

export function fmtEur(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100) + " €";
}

export function fmtUah(uah: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(uah) + " ₴";
}
