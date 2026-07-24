import { describe, expect, it } from "vitest";
import { getCanonicalNeighborhoodId, normalizeNeighborhoodKey, ruseNeighborhoods } from "./ruseNeighborhoods";

describe("normalizeNeighborhoodKey", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    expect(normalizeNeighborhoodKey("  Center  ")).toBe("center");
  });

  it("strips Bulgarian neighborhood prefixes and dashes", () => {
    expect(normalizeNeighborhoodKey("ЖК Дружба-1")).toBe("дружба 1");
  });
});

describe("getCanonicalNeighborhoodId", () => {
  it("resolves Bulgarian names to their canonical id", () => {
    expect(getCanonicalNeighborhoodId("Център")).toBe("center");
  });

  it("resolves English aliases to the same canonical id", () => {
    expect(getCanonicalNeighborhoodId("Wide Center")).toBe("center");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(getCanonicalNeighborhoodId("  ZDRAVETS EAST  ")).toBe("zdravets-east");
  });

  it("returns undefined for unknown or empty input", () => {
    expect(getCanonicalNeighborhoodId("Not A Real Neighborhood")).toBeUndefined();
    expect(getCanonicalNeighborhoodId(null)).toBeUndefined();
    expect(getCanonicalNeighborhoodId(undefined)).toBeUndefined();
  });

  it("every canonical neighborhood id is reachable through its own Bulgarian or English name", () => {
    for (const neighborhood of ruseNeighborhoods) {
      const byBg = getCanonicalNeighborhoodId(neighborhood.nameBg);
      const byEn = getCanonicalNeighborhoodId(neighborhood.nameEn);
      expect(byBg ?? byEn).toBe(neighborhood.id);
    }
  });
});
