// GPS-M5 §2.0 — D-29 hard guardrail. Guru talks ZERO income/earnings — even if asked directly.
// PURE + deterministic (so it's prompt-tested, per §2.0 "guardrail prompt-tested"). Applied to BOTH
// the learner's question (block before we ever call the model) AND the model's answer (block even if
// the model tries to answer). A trip → warm Hinglish redirect to course content, never a number.
//
// Precision matters: legitimate course concepts (revenue, profit, ROI, margin) are NOT blocked —
// only PERSONAL earning intent ("kitna kamaunga", "how much can I earn", "refer and earn", salary,
// income, payout, commission…). Bias, when ambiguous, is toward redirecting (D-29 is a floor).

/** Normalize for matching: lowercase, keep ₹ + word chars, collapse whitespace. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}₹\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Hinglish earn conjugations (kama/kamaa/kamana/kamao/kamai/kamaunga/kamaenge/kamayenge…). The
// suffix set is explicit so "kamaal" (amazing) and "kamal" (a name) do NOT match — only earning forms.
const EARN_STEM =
  /\bkama(?:a|na|ana|ao|aao|unga|aunga|enge|ayenge|ega|egi|oge|i|ai|ya|ye|aa)?\b/;
const EARN_TERMS =
  /\b(earn|earns|earning|earnings|earned|income|incomes|salary|salaries|stipend|payout|payouts|commission|commissions)\b/;
const EARN_PHRASES = [
  "make money",
  "making money",
  "refer and earn",
  "refer & earn",
  "paisa kaise",
  "paise kaise",
  "earning potential",
  "income guarantee",
  "guaranteed income",
  "passive income",
  "side income",
  "extra income",
];
// "how much …" combined with a money word = an earnings question even without an earn verb.
const HOW_MUCH = /\b(kitna|kitni|kitne|how much|how many)\b/;
const MONEY_WORD =
  /(₹|\brs\b|\brupees?\b|\brupaye?\b|\brupaya\b|\bpaisa\b|\bpaise\b|\bmoney\b)/;

// ── Numeric + period hardening (Fable Tier-A condition 1) ────────────────────────────────────────
// A per-period phrase ("per month", "monthly", "har mahine", "roz"…) — a rate question is an earnings
// question even without an earn verb.
const PERIOD =
  /\b(per\s?(month|day|week|hour)|monthly|daily|weekly|mahine|mahina|maheene|roz|rozana|har\s?(mahine|din|hafte|ghante))\b/;
// A scaled amount ("50k", "5 lakh", "10 hazaar") or an explicit currency+number ("₹5000", "rs 5000").
const SCALED_AMOUNT = /\b\d+\s?(k|hazaar|hazar|lakh|lakhs|thousand|thousands|crore|crores)\b/;
const CURRENCY_NUM = /(₹\s?\d)|(\brs\.?\s?\d)/;
// Any money/earning signal (excluding a bare number, which alone is fine — "lesson me 5 steps").
const EARN_SIGNAL = (t: string): boolean =>
  EARN_STEM.test(t) || EARN_TERMS.test(t) || MONEY_WORD.test(t) || HOW_MUCH.test(t);

/** PURE: does this text carry personal income/earnings intent (D-29 tripwire)? */
export function hasIncomeIntent(text: string): boolean {
  const t = normalize(text);
  if (!t) return false;
  if (EARN_STEM.test(t)) return true;
  if (EARN_TERMS.test(t)) return true;
  if (EARN_PHRASES.some((p) => t.includes(p))) return true;
  if (HOW_MUCH.test(t) && MONEY_WORD.test(t)) return true;
  // A per-period phrase alongside ANY money/amount/earn/how-much signal = an earning-RATE question.
  if (PERIOD.test(t) && (EARN_SIGNAL(t) || SCALED_AMOUNT.test(t) || CURRENCY_NUM.test(t))) return true;
  // A scaled amount or a currency+number alongside an earn/how-much/period signal = an earnings claim.
  // (A currency amount ALONE is allowed — a finance course legitimately says "is stock ki price ₹500".)
  const amount = SCALED_AMOUNT.test(t) || CURRENCY_NUM.test(t);
  if (amount && (EARN_STEM.test(t) || EARN_TERMS.test(t) || HOW_MUCH.test(t) || PERIOD.test(t)))
    return true;
  return false;
}

// Warm Hinglish redirect — LC #37 copy slot (finalized with the founder pre-launch). D-29-safe:
// acknowledges warmly, promises nothing, steers back to learning. Never contains a number.
export const GURU_INCOME_REDIRECT =
  "Main aapka course tutor hoon — paise ya kamai ki baat main nahi kar sakta. " +
  "Chalo is lesson ka koi bhi concept clear karte hain, jo bhi doubt ho pooch lo!";
