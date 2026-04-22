import { mockSignals } from "../data/mockSignals";
import { neighborhoodAliasByDistrict } from "../data/ruseNeighborhoods";
import type {
  Signal,
  SignalRow,
  SignalTimelineActor,
  SignalTimelineEvent,
  SignalTimelineEventType,
} from "../types";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

export interface FetchSignalsResult {
  signals: Signal[];
  isFallback: boolean;
  error?: string;
}

function mapRowToSignal(row: SignalRow): Signal {
  const district = row.district ?? "Unknown";
  const aliasKey = district.toLowerCase();
  const timeline = mapTimeline(row);

  return {
    id: row.id,
    title: row.title,
    summary: row.description,
    district,
    neighborhoodId: row.neighborhood_id ?? neighborhoodAliasByDistrict[aliasKey],
    status: row.status,
    priority: row.priority,
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
    createdAt: row.created_at,
    attachments: (row.signal_attachments ?? []).map((attachment) => ({
      id: attachment.id,
      fileName: attachment.file_name,
      mimeType: attachment.mime_type,
      publicUrl: attachment.public_url,
    })),
    communicationTimeline: timeline,
  };
}

function parseEventType(rawType: string): SignalTimelineEventType | undefined {
  if (
    rawType === "original_signal" ||
    rawType === "ai_summary" ||
    rawType === "submitted_to_municipality" ||
    rawType === "municipality_response" ||
    rawType === "ai_response_review"
  ) {
    return rawType;
  }

  return undefined;
}

function parseActor(rawActor: string | undefined, eventType: SignalTimelineEventType): SignalTimelineActor {
  if (rawActor === "citizen" || rawActor === "ai" || rawActor === "system" || rawActor === "municipality") {
    return rawActor;
  }

  if (eventType === "original_signal") return "citizen";
  if (eventType === "ai_summary" || eventType === "ai_response_review") return "ai";
  if (eventType === "municipality_response") return "municipality";
  return "system";
}

function buildFallbackTimeline(row: SignalRow): SignalTimelineEvent[] {
  const createdAt = row.created_at;
  const originalMessage = row.description;

  const timeline: SignalTimelineEvent[] = [
    {
      id: `${row.id}-original`,
      eventType: "original_signal",
      actor: "citizen",
      message: originalMessage,
      createdAt,
    },
    {
      id: `${row.id}-ai-summary`,
      eventType: "ai_summary",
      actor: "ai",
      message: `AI summary: ${row.description}`,
      createdAt,
    },
    {
      id: `${row.id}-submitted`,
      eventType: "submitted_to_municipality",
      actor: "system",
      message: "Signal sent to municipality for official review.",
      createdAt,
    },
  ];

  if (row.status === "Resolved") {
    timeline.push({
      id: `${row.id}-municipality-response`,
      eventType: "municipality_response",
      actor: "municipality",
      message: "Municipality marked this signal as resolved.",
      createdAt,
    });
    timeline.push({
      id: `${row.id}-ai-review`,
      eventType: "ai_response_review",
      actor: "ai",
      message: "AI review: municipality response appears satisfactory.",
      createdAt,
      satisfactory: true,
    });
  } else if (row.status === "No Response") {
    timeline.push({
      id: `${row.id}-ai-review`,
      eventType: "ai_response_review",
      actor: "ai",
      message: "AI review: no response yet. Follow-up should request deadline and clear action.",
      createdAt,
      satisfactory: false,
    });
  }

  return timeline;
}

function mapTimeline(row: SignalRow): SignalTimelineEvent[] {
  const rawEvents = row.signal_events ?? [];
  if (rawEvents.length === 0) {
    return buildFallbackTimeline(row);
  }

  const parsedEvents = rawEvents
    .map((event) => {
      const eventType = parseEventType(event.event_type);
      if (!eventType || !event.payload?.message) {
        return null;
      }

      const parsedEvent: SignalTimelineEvent = {
        id: event.id,
        eventType,
        actor: parseActor(event.payload.actor, eventType),
        message: event.payload.message,
        createdAt: event.created_at,
      };

      if (typeof event.payload.satisfactory === "boolean") {
        parsedEvent.satisfactory = event.payload.satisfactory;
      }

      return parsedEvent;
    })
    .filter((event): event is SignalTimelineEvent => event !== null)
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );

  if (parsedEvents.length === 0) {
    return buildFallbackTimeline(row);
  }

  return parsedEvents;
}

export async function fetchSignals(): Promise<FetchSignalsResult> {
  if (!hasSupabaseEnv || !supabase) {
    return { signals: mockSignals, isFallback: true };
  }

  const { data, error } = await supabase
    .from("signals")
    .select(
      "id,title,description,district,neighborhood_id,status,priority,upvotes,downvotes,created_at,signal_attachments(id,file_name,mime_type,public_url),signal_events(id,event_type,payload,created_at)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return {
      signals: mockSignals,
      isFallback: true,
      error: error.message,
    };
  }

  const rows = (data ?? []) as SignalRow[];
  return {
    signals: rows.map(mapRowToSignal),
    isFallback: false,
  };
}
