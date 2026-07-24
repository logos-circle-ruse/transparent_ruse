export type SignalPriorityLevel = "Critical" | "High" | "Normal";

/**
 * Derives a signal's priority level from its net vote score (upvotes - downvotes).
 * Shared between the `vote` edge function and its test suite.
 */
export function derivePriority(score: number): SignalPriorityLevel {
  if (score >= 30) return "Critical";
  if (score >= 12) return "High";
  return "Normal";
}
