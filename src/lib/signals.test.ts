import { describe, expect, it } from "vitest";
import { mapRowToSignal } from "./signals";
import type { SignalRow } from "../types";

function baseRow(overrides: Partial<SignalRow> = {}): SignalRow {
  return {
    id: "row-1",
    title: "Broken streetlight",
    description: "The streetlight has been off for a week.",
    district: "Center",
    status: "Pending",
    priority: "Normal",
    upvotes: 3,
    downvotes: 1,
    created_at: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("mapRowToSignal", () => {
  it("maps core fields and defaults null votes to zero", () => {
    const signal = mapRowToSignal(baseRow({ upvotes: null, downvotes: null }));
    expect(signal.id).toBe("row-1");
    expect(signal.title).toBe("Broken streetlight");
    expect(signal.summary).toBe("The streetlight has been off for a week.");
    expect(signal.upvotes).toBe(0);
    expect(signal.downvotes).toBe(0);
  });

  it("falls back to 'Unknown' district when missing", () => {
    const signal = mapRowToSignal(baseRow({ district: null }));
    expect(signal.district).toBe("Unknown");
  });

  it("falls back to 'Unknown' district for an empty or whitespace-only string, not just null", () => {
    expect(mapRowToSignal(baseRow({ district: "" })).district).toBe("Unknown");
    expect(mapRowToSignal(baseRow({ district: "   " })).district).toBe("Unknown");
  });

  it("maps attachments from signal_attachments rows", () => {
    const signal = mapRowToSignal(
      baseRow({
        signal_attachments: [
          { id: "att-1", file_name: "photo.jpg", mime_type: "image/jpeg", public_url: "https://example.test/photo.jpg" },
        ],
      })
    );
    expect(signal.attachments).toHaveLength(1);
    expect(signal.attachments[0]).toEqual({
      id: "att-1",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
      publicUrl: "https://example.test/photo.jpg",
    });
  });

  it("builds a fallback communication timeline when there are no signal_events", () => {
    const signal = mapRowToSignal(baseRow());
    const eventTypes = signal.communicationTimeline.map((event) => event.eventType);
    expect(eventTypes).toEqual(["original_signal", "ai_summary", "submitted_to_municipality"]);
  });

  it("appends a satisfactory AI review event to the fallback timeline when resolved", () => {
    const signal = mapRowToSignal(baseRow({ status: "Resolved" }));
    const review = signal.communicationTimeline.find((event) => event.eventType === "ai_response_review");
    expect(review?.satisfactory).toBe(true);
  });

  it("appends an unsatisfactory AI review event to the fallback timeline when there is no response", () => {
    const signal = mapRowToSignal(baseRow({ status: "No Response" }));
    const review = signal.communicationTimeline.find((event) => event.eventType === "ai_response_review");
    expect(review?.satisfactory).toBe(false);
  });

  it("maps and sorts real signal_events instead of using the fallback timeline", () => {
    const signal = mapRowToSignal(
      baseRow({
        signal_events: [
          {
            id: "evt-2",
            event_type: "ai_summary",
            payload: { actor: "ai", message: "AI summary text" },
            created_at: "2026-01-01T11:00:00.000Z",
          },
          {
            id: "evt-1",
            event_type: "original_signal",
            payload: { actor: "citizen", message: "Original text" },
            created_at: "2026-01-01T10:00:00.000Z",
          },
        ],
      })
    );

    expect(signal.communicationTimeline.map((event) => event.id)).toEqual(["evt-1", "evt-2"]);
    expect(signal.communicationTimeline[0].message).toBe("Original text");
  });

  it("defaults the actor based on event type when payload.actor is missing or unrecognized", () => {
    const signal = mapRowToSignal(
      baseRow({
        signal_events: [
          {
            id: "evt-1",
            event_type: "municipality_response",
            payload: { message: "We will fix it next week." },
            created_at: "2026-01-01T10:00:00.000Z",
          },
        ],
      })
    );
    expect(signal.communicationTimeline[0].actor).toBe("municipality");
  });

  it("drops signal_events with an unrecognized event type or missing message", () => {
    const signal = mapRowToSignal(
      baseRow({
        signal_events: [
          { id: "evt-1", event_type: "unknown_type", payload: { message: "should be dropped" }, created_at: "2026-01-01T10:00:00.000Z" },
          { id: "evt-2", event_type: "original_signal", payload: {}, created_at: "2026-01-01T10:00:01.000Z" },
        ],
      })
    );
    // Both events are invalid, so it should fall back to the generated timeline instead of an empty one.
    expect(signal.communicationTimeline.length).toBeGreaterThan(0);
    expect(signal.communicationTimeline.every((event) => event.id.startsWith("row-1"))).toBe(true);
  });

  it("resolves neighborhoodId from neighborhood_id column first, then falls back to district alias", () => {
    const withExplicitId = mapRowToSignal(baseRow({ neighborhood_id: "vazrazhdane", district: "Center" }));
    expect(withExplicitId.neighborhoodId).toBe("vazrazhdane");

    const withAliasOnly = mapRowToSignal(baseRow({ neighborhood_id: null, district: "Center" }));
    expect(withAliasOnly.neighborhoodId).toBe("center");
  });
});
