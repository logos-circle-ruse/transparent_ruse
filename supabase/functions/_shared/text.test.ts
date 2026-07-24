import { describe, expect, it } from "vitest";
import { resolveOrFallback } from "./text";

describe("resolveOrFallback", () => {
  it("returns the trimmed value when it has real content", () => {
    expect(resolveOrFallback("  Center  ", "Unknown")).toBe("Center");
  });

  it("falls back for an empty string, unlike a plain ?? check", () => {
    expect(resolveOrFallback("", "Unknown")).toBe("Unknown");
  });

  it("falls back for a whitespace-only string", () => {
    expect(resolveOrFallback("   ", "Unknown")).toBe("Unknown");
  });

  it("falls back for null and undefined", () => {
    expect(resolveOrFallback(null, "Unknown")).toBe("Unknown");
    expect(resolveOrFallback(undefined, "Unknown")).toBe("Unknown");
  });
});
