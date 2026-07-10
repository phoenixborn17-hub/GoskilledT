// Product feature flags (presentation / availability only — never money-gating; those live in
// lib/env.ts, e.g. payoutsEnabled). Kept tiny + explicit so surfaces can be turned on/off without
// deleting code or changing routes.

/**
 * Guru (AI Hinglish tutor). DISABLED for now per Nav_Workspace_Architecture v1.1 (removed from all
 * nav / in-context chips). The tutor code (GuruPanel, engine, deep-links) stays in the tree behind
 * this flag — flip to `true` to bring it back with no routing change.
 */
export function guruEnabled(): boolean {
  return false;
}
