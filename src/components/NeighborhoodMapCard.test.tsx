import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NeighborhoodMapCard } from "./NeighborhoodMapCard";
import { translations } from "../i18n";
import { ruseNeighborhoods } from "../data/ruseNeighborhoods";
import type { Signal } from "../types";

const VAZRAZHDANE_NAME_BG = ruseNeighborhoods.find((n) => n.id === "vazrazhdane")?.nameBg ?? "";

function buildSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "signal-1",
    title: "Broken streetlight",
    district: "Center",
    neighborhoodId: "center",
    createdAt: "2026-01-01T10:00:00.000Z",
    status: "Pending",
    priority: "Normal",
    summary: "Summary",
    upvotes: 0,
    downvotes: 0,
    attachments: [],
    communicationTimeline: [],
    ...overrides,
  };
}

function findListItemByNeighborhoodName(name: string) {
  const buttons = screen.getAllByRole("button");
  const match = buttons.find((button) => button.textContent?.trimStart().startsWith(name));
  if (!match) {
    throw new Error(`No stats list item found starting with "${name}"`);
  }
  return match;
}

describe("NeighborhoodMapCard", () => {
  it("renders the neighborhood stats list collapsed to 5 entries with an expand button", async () => {
    const text = translations.bg;
    const user = userEvent.setup();

    render(
      <NeighborhoodMapCard
        signals={[buildSignal()]}
        locale="bg"
        text={text}
        neighborhoodFilter="all"
        onNeighborhoodFilterChange={vi.fn()}
      />
    );

    const listItems = screen.getAllByRole("button", { name: /сигнала/ });
    expect(listItems.length).toBe(5);

    const expandButton = screen.getByRole("button", { name: text.mapSeeAllNeighborhoods });
    await user.click(expandButton);

    const expandedItems = screen.getAllByRole("button", { name: /сигнала/ });
    expect(expandedItems.length).toBeGreaterThan(5);
    expect(screen.getByRole("button", { name: text.mapSeeLessNeighborhoods })).toBeInTheDocument();
  });

  it("counts a signal under the neighborhood it belongs to via neighborhoodId", () => {
    const text = translations.bg;
    render(
      <NeighborhoodMapCard
        signals={[buildSignal({ neighborhoodId: "vazrazhdane" })]}
        locale="bg"
        text={text}
        neighborhoodFilter="all"
        onNeighborhoodFilterChange={vi.fn()}
      />
    );

    const item = findListItemByNeighborhoodName(VAZRAZHDANE_NAME_BG);
    expect(item).toHaveTextContent("1");
  });

  it("toggles the neighborhood filter when clicking the active item again", async () => {
    const text = translations.bg;
    const onNeighborhoodFilterChange = vi.fn();
    const user = userEvent.setup();

    render(
      <NeighborhoodMapCard
        signals={[buildSignal({ neighborhoodId: "vazrazhdane" })]}
        locale="bg"
        text={text}
        neighborhoodFilter="vazrazhdane"
        onNeighborhoodFilterChange={onNeighborhoodFilterChange}
      />
    );

    const item = findListItemByNeighborhoodName(VAZRAZHDANE_NAME_BG);
    await user.click(item);
    expect(onNeighborhoodFilterChange).toHaveBeenCalledWith("all");
  });
});
