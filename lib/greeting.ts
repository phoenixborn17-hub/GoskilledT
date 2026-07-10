// Dynamic greeting rules (Dashboard §5 personalization) — real state only (name + IST time-of-day),
// never a fabricated insight (D-29). Shared by the workspace headers.

export function istHour(now: Date = new Date()): number {
  return new Date(now.getTime() + 330 * 60_000).getUTCHours();
}

/** "Namaste, {first name}" (falls back to plain "Namaste" when the name is unknown). */
export function greetingTitle(name: string | null | undefined): string {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `Namaste, ${first}` : "Namaste";
}

/** Time-of-day line (IST). */
export function timeOfDayLine(hour: number = istHour()): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
