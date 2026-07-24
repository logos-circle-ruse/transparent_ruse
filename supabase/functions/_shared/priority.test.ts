import { describe, expect, it } from "vitest";
import { derivePriority } from "./priority";

describe("derivePriority", () => {
  it("returns Normal for a low or negative score", () => {
    expect(derivePriority(0)).toBe("Normal");
    expect(derivePriority(-5)).toBe("Normal");
    expect(derivePriority(11)).toBe("Normal");
  });

  it("returns High once the score crosses the High threshold", () => {
    expect(derivePriority(12)).toBe("High");
    expect(derivePriority(29)).toBe("High");
  });

  it("returns Critical once the score crosses the Critical threshold", () => {
    expect(derivePriority(30)).toBe("Critical");
    expect(derivePriority(100)).toBe("Critical");
  });
});
