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

/** PURE: does this text carry personal income/earnings intent (D-29 tripwire)? */
export function hasIncomeIntent(text: string): boolean {
  const t = normalize(text);
  if (!t) return false;
  if (EARN_STEM.test(t)) return true;
  if (EARN_TERMS.test(t)) return true;
  if (EARN_PHRASES.some((p) => t.includes(p))) return true;
  if (HOW_MUCH.test(t) && MONEY_WORD.test(t)) return true;
  return false;
}

// Warm Hinglish redirect — LC #37 copy slot (finalized with the founder pre-launch). D-29-safe:
// acknowledges warmly, promises nothing, steers back to learning. Never contains a number.
export const GURU_INCOME_REDIRECT =
  "Main aapka course tutor hoon — paise ya kamai ki baat main nahi kar sakta. " +
  "Chalo is lesson ka koi bhi concept clear karte hain, jo bhi doubt ho pooch lo!";
