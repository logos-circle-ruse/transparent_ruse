export const SIGNAL_STATUSES = [
  "Resolved",
  "Pending",
  "No Response",
] as const;

export type SignalStatus = (typeof SIGNAL_STATUSES)[number];
export type SignalPriority = "Critical" | "High" | "Normal";
export type SignalTimelineActor = "citizen" | "ai" | "system" | "municipality";
export type SignalTimelineEventType =
  | "original_signal"
  | "ai_summary"
  | "submitted_to_municipality"
  | "municipality_response"
  | "ai_response_review";

export interface SignalAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  publicUrl: string;
}

export interface Signal {
  id: string;
  title: string;
  district: string;
  neighborhoodId?: string;
  createdAt: string;
  status: SignalStatus;
  priority: SignalPriority;
  summary: string;
  upvotes: number;
  downvotes: number;
  attachments: SignalAttachment[];
  communicationTimeline: SignalTimelineEvent[];
}

export interface SignalTimelineEvent {
  id: string;
  eventType: SignalTimelineEventType;
  actor: SignalTimelineActor;
  message: string;
  createdAt: string;
  satisfactory?: boolean;
}

export interface SignalAttachmentRow {
  id: string;
  file_name: string;
  mime_type: string;
  public_url: string;
}

export interface SignalRow {
  id: string;
  title: string;
  description: string;
  district: string | null;
  neighborhood_id?: string | null;
  status: SignalStatus;
  priority: SignalPriority;
  upvotes: number | null;
  downvotes: number | null;
  created_at: string;
  signal_attachments?: SignalAttachmentRow[];
  signal_events?: SignalEventRow[];
}

export interface SignalEventRow {
  id: string;
  event_type: string;
  payload: {
    actor?: string;
    message?: string;
    satisfactory?: boolean;
  } | null;
  created_at: string;
}
