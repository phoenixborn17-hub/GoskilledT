// All money is stored and computed in PAISE (integer). Never use floats for money.
export const rupees = (paise: number): number => paise / 100;
export const toPaise = (rupees: number): number => Math.round(rupees * 100);
export const formatINR = (paise: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
