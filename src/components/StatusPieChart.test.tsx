import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusPieChart } from "./StatusPieChart";
import { statusLabels, translations } from "../i18n";
import type { Signal } from "../types";

function buildSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "signal-1",
    title: "Broken streetlight",
    district: "Center",
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

describe("StatusPieChart", () => {
  it("renders a legend entry per status with the correct count", () => {
    const signals = [
      buildSignal({ id: "1", status: "Pending" }),
      buildSignal({ id: "2", status: "Pending" }),
      buildSignal({ id: "3", status: "Resolved" }),
    ];
    const text = translations.bg;
    const labelByStatus = statusLabels.bg;

    render(
      <StatusPieChart
        signals={signals}
        title={text.overviewTitle}
        description={text.overviewDescription}
        locale="bg"
        statusLabel={(status) => labelByStatus[status]}
      />
    );

    const pendingItem = screen.getByText(labelByStatus.Pending).closest("li");
    expect(pendingItem).toHaveTextContent("2");

    const resolvedItem = screen.getByText(labelByStatus.Resolved).closest("li");
    expect(resolvedItem).toHaveTextContent("1");

    const noResponseItem = screen.getByText(labelByStatus["No Response"]).closest("li");
    expect(noResponseItem).toHaveTextContent("0");
  });

  it("renders all statuses with zero counts when there are no signals", () => {
    const text = translations.en;
    const labelByStatus = statusLabels.en;

    render(
      <StatusPieChart
        signals={[]}
        title={text.overviewTitle}
        description={text.overviewDescription}
        locale="en"
        statusLabel={(status) => labelByStatus[status]}
      />
    );

    expect(screen.getByText(labelByStatus.Resolved).closest("li")).toHaveTextContent("0");
    expect(screen.getByText(labelByStatus.Pending).closest("li")).toHaveTextContent("0");
    expect(screen.getByText(labelByStatus["No Response"]).closest("li")).toHaveTextContent("0");
  });
});
