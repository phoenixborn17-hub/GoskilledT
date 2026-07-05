// GPS-M5 §2.0 — Course Knowledge Base retrieval. CORPUS-ONLY: Guru may only use what these chunks
// contain — no internet, no general LLM knowledge. PURE + deterministic (testable).
//
// Implementation choice (builder's choice per spec, documented here): lexical BM25-lite over
// transcript/notes/glossary chunks. We deliberately avoid an embedding service — it would add an
// external dependency and a per-chunk cost, and lexical retrieval is more than enough for
// "which lesson answers this doubt" on short course corpora. Retrieval can later swap to embeddings
// behind this same interface without touching the engine (FUTURE_IDEAS). Out-of-scope is detected
// mechanically: zero content-term overlap with the corpus → redirect (never hallucinate).

import type { KnowledgeChunk } from "./types";

// Small English + Hinglish stopword set (question fillers that aren't content terms).
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "am",
  "was",
  "were",
  "be",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "and",
  "or",
  "but",
  "if",
  "it",
  "this",
  "that",
  "these",
  "those",
  "do",
  "does",
  "did",
  "how",
  "what",
  "why",
  "when",
  "which",
  "who",
  "i",
  "you",
  "me",
  "my",
  "your",
  "can",
  "will",
  "should",
  "kya",
  "hai",
  "hain",
  "ka",
  "ke",
  "ki",
  "ko",
  "me",
  "mein",
  "se",
  "ye",
  "yeh",
  "wo",
  "woh",
  "kaise",
  "kaisa",
  "kaun",
  "ho",
  "hoon",
  "hu",
  "kar",
  "karo",
  "karu",
  "karna",
  "mujhe",
  "mera",
  "meri",
  "aur",
  "ya",
  "bhi",
  "hi",
  "toh",
  "to",
  "na",
  "ne",
  "par",
  "koi",
  "kuch",
  "sakta",
  "sakti",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

/**
 * PURE: split raw knowledge text into retrieval chunks (~target chars, sentence-aware). Keeps each
 * chunk bound to its lesson so citations are exact. Empty/whitespace input → no chunks.
 */
export function chunkText(
  raw: string,
  meta: Omit<KnowledgeChunk, "text">,
  targetChars = 480,
): KnowledgeChunk[] {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  // Split on sentence boundaries (., !, ?, |, newline already collapsed) then greedily pack.
  const sentences = clean.split(/(?<=[.!?।])\s+/);
  const chunks: KnowledgeChunk[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && buf.length + s.length + 1 > targetChars) {
      chunks.push({ ...meta, text: buf.trim() });
      buf = "";
    }
    buf += (buf ? " " : "") + s;
  }
  if (buf.trim()) chunks.push({ ...meta, text: buf.trim() });
  return chunks;
}

export interface ScoredChunk {
  chunk: KnowledgeChunk;
  score: number;
}

export interface RetrievalResult {
  hits: ScoredChunk[];
  /** true when the corpus is non-empty but nothing overlaps the question → out-of-scope redirect. */
  outOfScope: boolean;
  /** true when there is no knowledge at all for this course → honest "not taught yet" state. */
  empty: boolean;
}

// BM25 parameters (standard defaults).
const K1 = 1.5;
const B = 0.75;

/**
 * PURE: rank chunks against the question with BM25-lite; return top-k. `outOfScope` when the corpus
 * exists but no content term overlaps (best score 0). `empty` when there are no chunks at all.
 */
export function retrieve(
  question: string,
  chunks: KnowledgeChunk[],
  opts: { topK?: number } = {},
): RetrievalResult {
  const topK = opts.topK ?? 3;
  if (chunks.length === 0) return { hits: [], outOfScope: false, empty: true };

  const qTerms = [...new Set(tokenize(question))];
  const docs = chunks.map((c) => tokenize(c.text));
  const avgLen = docs.reduce((a, d) => a + d.length, 0) / docs.length || 1;

  // Document frequency per query term.
  const df = new Map<string, number>();
  for (const term of qTerms) {
    let n = 0;
    for (const d of docs) if (d.includes(term)) n++;
    df.set(term, n);
  }
  const N = docs.length;
  const idf = (term: string) => {
    const n = df.get(term) ?? 0;
    // BM25 idf, floored at 0 so ubiquitous terms don't push scores negative.
    return Math.max(0, Math.log(1 + (N - n + 0.5) / (n + 0.5)));
  };

  const scored: ScoredChunk[] = chunks.map((chunk, i) => {
    const doc = docs[i];
    const len = doc.length || 1;
    let score = 0;
    for (const term of qTerms) {
      const tf = doc.filter((w) => w === term).length;
      if (tf === 0) continue;
      const num = tf * (K1 + 1);
      const den = tf + K1 * (1 - B + B * (len / avgLen));
      score += idf(term) * (num / den);
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.score ?? 0;
  if (best <= 0) return { hits: [], outOfScope: true, empty: false };

  return {
    hits: scored.filter((s) => s.score > 0).slice(0, topK),
    outOfScope: false,
    empty: false,
  };
}
