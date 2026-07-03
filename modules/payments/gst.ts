// GST math for GST-INCLUSIVE display prices (DR-023). All money in PAISE.
// Display price ₹X includes GST; for invoices/books we back-calculate the split.
// GST applies only if registered (D-03) — pass gstRateBps = 0 when not registered.

export interface GstBreakdown {
  totalInPaise: number; // what the customer pays (the display price)
  baseInPaise: number;  // taxable value
  gstInPaise: number;   // GST portion (total - base)
}

/** Back-calculate base + GST from an inclusive price. rateBps: 1800 = 18%. */
export function gstFromInclusive(totalInPaise: number, rateBps: number): GstBreakdown {
  if (!Number.isInteger(totalInPaise) || totalInPaise < 0) throw new Error("total must be a non-negative integer (paise)");
  if (!Number.isInteger(rateBps) || rateBps < 0) throw new Error("rateBps must be a non-negative integer");
  const baseInPaise = Math.round((totalInPaise * 10000) / (10000 + rateBps));
  return { totalInPaise, baseInPaise, gstInPaise: totalInPaise - baseInPaise };
}
