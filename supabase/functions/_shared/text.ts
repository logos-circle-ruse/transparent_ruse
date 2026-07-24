/**
 * Resolves a possibly-missing/blank string to a trimmed value, or a fallback
 * when the value is null, undefined, or only whitespace.
 *
 * Plain `value ?? fallback` only catches null/undefined and misses the very
 * common case of an empty string coming from an unselected form field
 * (e.g. an optional dropdown or text input submitted as ""), which used to
 * cause signals to be stored with district="" / submitter_name="" instead
 * of the intended "Unknown" / "Anonymous" fallback.
 */
export function resolveOrFallback(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}
