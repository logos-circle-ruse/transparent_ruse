import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Signal } from "./types";

vi.mock("./components/NeighborhoodMapCard", () => ({
  NeighborhoodMapCard: () => null,
}));
vi.mock("./components/StatusPieChart", () => ({
  StatusPieChart: () => null,
}));

const { fetchSignalsMock } = vi.hoisted(() => ({ fetchSignalsMock: vi.fn() }));
vi.mock("./lib/signals", () => ({
  fetchSignals: fetchSignalsMock,
}));

const { voteSignalMock } = vi.hoisted(() => ({ voteSignalMock: vi.fn() }));
vi.mock("./lib/vote", () => ({
  voteSignal: voteSignalMock,
}));

function buildSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "signal-1",
    title: "Broken streetlight",
    district: "Center",
    createdAt: "2026-01-01T10:00:00.000Z",
    status: "Pending",
    priority: "Normal",
    summary: "The streetlight has been off for a week.",
    upvotes: 3,
    downvotes: 1,
    attachments: [],
    communicationTimeline: [],
    ...overrides,
  };
}

// Regression test for the bug fixed in commit 236d9ef: the modal used to read
// from a frozen `selectedSignal` snapshot instead of the live `signals` state,
// so a successful vote updated the list but never the open modal.
describe("App voting flow", () => {
  it("updates the open signal modal with live vote counts after voting, not a stale snapshot", async () => {
    const initialSignal = buildSignal();
    fetchSignalsMock.mockResolvedValue({ signals: [initialSignal], isFallback: false });
    voteSignalMock.mockResolvedValue({
      id: "signal-1",
      upvotes: 4,
      downvotes: 1,
      priority: "Normal",
    });

    const { default: App } = await import("./App");
    const user = userEvent.setup();
    render(<App />);

    const openDetailsButton = await screen.findByRole("button", { name: "Детайли" });
    await user.click(openDetailsButton);

    const voteUpButton = await screen.findByRole("button", { name: /Подкрепям/ });
    expect(voteUpButton).toHaveTextContent("(+3)");

    await user.click(voteUpButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Подкрепям/ })).toHaveTextContent("(+4)");
    });

    expect(voteSignalMock).toHaveBeenCalledWith("signal-1", "up");
  });
});
