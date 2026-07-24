import { describe, expect, it } from "vitest";
import { reorderFlowSteps, sortFlowSteps } from "./flowDefinitions";

const sampleSteps = [
  {
    id: "a",
    sort_order: 0,
    title_bg: "A",
    title_en: "A",
    description_bg: "",
    description_en: "",
    actor: "system" as const,
  },
  {
    id: "b",
    sort_order: 1,
    title_bg: "B",
    title_en: "B",
    description_bg: "",
    description_en: "",
    actor: "ai" as const,
  },
  {
    id: "c",
    sort_order: 2,
    title_bg: "C",
    title_en: "C",
    description_bg: "",
    description_en: "",
    actor: "citizen" as const,
  },
];

describe("sortFlowSteps", () => {
  it("orders by sort_order ascending", () => {
    const sorted = sortFlowSteps([
      { sort_order: 2, id: "x" },
      { sort_order: 0, id: "y" },
      { sort_order: 1, id: "z" },
    ]);

    expect(sorted.map((step) => step.id)).toEqual(["y", "z", "x"]);
  });
});

describe("reorderFlowSteps", () => {
  it("moves a step down", () => {
    const next = reorderFlowSteps(sampleSteps, "b", "down");
    expect(next.map((step) => step.id)).toEqual(["a", "c", "b"]);
    expect(next.map((step) => step.sort_order)).toEqual([0, 1, 2]);
  });

  it("moves a step up", () => {
    const next = reorderFlowSteps(sampleSteps, "b", "up");
    expect(next.map((step) => step.id)).toEqual(["b", "a", "c"]);
  });

  it("ignores invalid moves at edges", () => {
    const next = reorderFlowSteps(sampleSteps, "a", "up");
    expect(next.map((step) => step.id)).toEqual(["a", "b", "c"]);
  });
});
