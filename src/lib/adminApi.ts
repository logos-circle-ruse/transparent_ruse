import type { SignalRow } from "../types";
import type { AdminSignal, ResponseReviewResult } from "../types";
import { mapRowToSignal } from "./signals";
import { getAdminSession } from "./adminAuth";

const adminApiUrl =
  import.meta.env.VITE_SUPABASE_ADMIN_URL ??
  (import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`
    : undefined);

async function adminRequest<T>(body: Record<string, unknown>): Promise<T> {
  if (!adminApiUrl) {
    throw new Error("Admin API URL is not configured.");
  }

  const session = await getAdminSession();
  if (!session?.access_token) {
    throw new Error("Admin session is missing. Please sign in again.");
  }

  const response = await fetch(adminApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Admin API failed with status ${response.status}`);
  }

  return payload;
}

function mapAdminSignal(row: SignalRow): AdminSignal {
  const signal = mapRowToSignal(row);

  return {
    id: signal.id,
    title: signal.title,
    description: row.description,
    district: signal.district,
    neighborhoodId: row.neighborhood_id ?? null,
    submitterName: row.submitter_name?.trim() || "Anonymous",
    status: signal.status,
    priority: signal.priority,
    upvotes: signal.upvotes,
    downvotes: signal.downvotes,
    aiModerationStatus: row.ai_moderation_status ?? "approved",
    aiModerationReason: row.ai_moderation_reason ?? null,
    createdAt: signal.createdAt,
    updatedAt: row.updated_at ?? signal.createdAt,
    attachments: signal.attachments,
    communicationTimeline: signal.communicationTimeline,
  };
}

export async function fetchAdminSignals(): Promise<AdminSignal[]> {
  const result = await adminRequest<{ signals: SignalRow[] }>({ action: "list_signals" });
  return (result.signals ?? []).map(mapAdminSignal);
}

export interface AdminSignalUpdates {
  title?: string;
  description?: string;
  district?: string;
  neighborhood_id?: string | null;
  status?: AdminSignal["status"];
  priority?: AdminSignal["priority"];
  submitter_name?: string;
  ai_moderation_status?: string;
  ai_moderation_reason?: string | null;
  upvotes?: number;
  downvotes?: number;
}

export async function updateAdminSignal(signalId: string, updates: AdminSignalUpdates) {
  const result = await adminRequest<{ signal: SignalRow }>({
    action: "update_signal",
    signalId,
    updates,
  });

  return mapAdminSignal(result.signal);
}

export async function addAdminTimelineEvent(input: {
  signalId: string;
  eventType: string;
  message: string;
  actor?: string;
  satisfactory?: boolean;
}) {
  return adminRequest<{ event: unknown }>({
    action: "add_event",
    ...input,
  });
}

export async function reviewMunicipalityResponse(input: {
  signalTitle: string;
  signalDescription: string;
  municipalityResponse: string;
}) {
  const result = await adminRequest<{ review: ResponseReviewResult }>({
    action: "review_response",
    ...input,
  });

  return result.review;
}

export async function simulateMunicipalityFlow(input: {
  signalId: string;
  municipalityResponse: string;
}) {
  return adminRequest<{
    review: ResponseReviewResult;
    municipalityEvent: unknown;
    reviewEvent: unknown;
    signal: { id: string; status: string; updated_at: string };
  }>({
    action: "simulate_municipality_flow",
    ...input,
  });
}

export type AiTestKind = "moderation" | "response_review";

export interface AiTestCaseRow {
  id: string;
  name: string;
  kind: AiTestKind;
  system_prompt: string;
  user_payload: unknown;
  expected: unknown | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiTestRunRow {
  id: string;
  test_case_id: string | null;
  kind: AiTestKind;
  model: string;
  temperature: number;
  ok: boolean;
  error: string | null;
  created_at: string;
  parsed_output: unknown | null;
  raw_output?: string | null;
}

export async function listAiTestCases() {
  const result = await adminRequest<{ cases: AiTestCaseRow[] }>({ action: "list_ai_test_cases" });
  return result.cases ?? [];
}

export async function upsertAiTestCase(input: {
  id?: string;
  name: string;
  kind: AiTestKind;
  system_prompt: string;
  user_payload: unknown;
  expected?: unknown;
  notes?: string;
}) {
  const result = await adminRequest<{ testCase: AiTestCaseRow }>({
    action: "upsert_ai_test_case",
    testCase: input,
  });

  return result.testCase;
}

export async function deleteAiTestCase(testCaseId: string) {
  await adminRequest<{ ok: true }>({ action: "delete_ai_test_case", testCaseId });
}

export async function listAiTestRuns() {
  const result = await adminRequest<{ runs: AiTestRunRow[] }>({ action: "list_ai_test_runs" });
  return result.runs ?? [];
}

export async function runAiTest(input: {
  testCaseId?: string;
  kind: AiTestKind;
  systemPrompt: string;
  userPayload: unknown;
  model?: string;
  temperature?: number;
}) {
  const result = await adminRequest<{ run: AiTestRunRow }>({ action: "run_ai_test", ...input });
  return result.run;
}

export async function createAdminSignal(input: {
  title: string;
  description: string;
  district?: string;
  neighborhood_id?: string | null;
  submitter_name?: string;
  status?: AdminSignal["status"];
  priority?: AdminSignal["priority"];
}) {
  const result = await adminRequest<{ signal: SignalRow }>({
    action: "create_signal",
    signal: input,
  });
  return mapAdminSignal(result.signal);
}

export async function deleteAdminSignal(signalId: string) {
  await adminRequest<{ ok: true }>({ action: "delete_signal", signalId });
}

export async function updateAdminEvent(input: {
  eventId: string;
  eventType?: string;
  message?: string;
  actor?: string;
  satisfactory?: boolean;
}) {
  return adminRequest<{ event: unknown }>({ action: "update_event", ...input });
}

export async function deleteAdminEvent(eventId: string) {
  await adminRequest<{ ok: true }>({ action: "delete_event", eventId });
}

export interface NeighborhoodRow {
  id: string;
  name_bg: string;
  name_en: string;
  aliases: string[];
  sort_order: number;
  active: boolean;
}

export async function listAdminNeighborhoods() {
  const result = await adminRequest<{ neighborhoods: NeighborhoodRow[] }>({
    action: "list_neighborhoods",
  });
  return result.neighborhoods ?? [];
}

export async function upsertAdminNeighborhood(input: NeighborhoodRow) {
  const result = await adminRequest<{ neighborhood: NeighborhoodRow }>({
    action: "upsert_neighborhood",
    neighborhood: input,
  });
  return result.neighborhood;
}

export async function deleteAdminNeighborhood(neighborhoodId: string) {
  await adminRequest<{ ok: true }>({ action: "delete_neighborhood", neighborhoodId });
}

export async function seedAdminNeighborhoods() {
  const result = await adminRequest<{ neighborhoods: NeighborhoodRow[]; count: number }>({
    action: "seed_neighborhoods",
  });
  return result;
}

export interface AiPromptRow {
  key: string;
  kind: "moderation" | "response_review" | "custom";
  title: string;
  description: string | null;
  system_prompt: string;
}

export async function listAdminAiPrompts() {
  const result = await adminRequest<{ prompts: AiPromptRow[] }>({ action: "list_ai_prompts" });
  return result.prompts ?? [];
}

export async function upsertAdminAiPrompt(input: AiPromptRow) {
  const result = await adminRequest<{ prompt: AiPromptRow }>({
    action: "upsert_ai_prompt",
    prompt: input,
  });
  return result.prompt;
}

export async function deleteAdminAiPrompt(promptKey: string) {
  await adminRequest<{ ok: true }>({ action: "delete_ai_prompt", promptKey });
}

export interface AdminProfileRow {
  user_id: string;
  display_name: string | null;
  created_at: string;
}

export async function listAdminProfiles() {
  const result = await adminRequest<{ admins: AdminProfileRow[] }>({ action: "list_admins" });
  return result.admins ?? [];
}

export async function addAdminProfile(email: string, displayName?: string) {
  const result = await adminRequest<{ admin: AdminProfileRow }>({
    action: "add_admin",
    adminEmail: email,
    displayName,
  });
  return result.admin;
}

export async function removeAdminProfile(adminUserId: string) {
  await adminRequest<{ ok: true }>({ action: "remove_admin", adminUserId });
}

async function adminMultipartRequest<T>(formData: FormData): Promise<T> {
  if (!adminApiUrl) {
    throw new Error("Admin API URL is not configured.");
  }

  const session = await getAdminSession();
  if (!session?.access_token) {
    throw new Error("Admin session is missing. Please sign in again.");
  }

  const response = await fetch(adminApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Admin API failed with status ${response.status}`);
  }

  return payload;
}

export async function uploadAdminAttachment(signalId: string, file: File) {
  const formData = new FormData();
  formData.append("action", "upload_attachment");
  formData.append("signalId", signalId);
  formData.append("attachment", file);

  const result = await adminMultipartRequest<{
    attachments: Array<{
      id: string;
      file_name: string;
      mime_type: string;
      public_url: string;
      size_bytes: number;
    }>;
  }>(formData);

  return (result.attachments ?? []).map((attachment) => ({
    id: attachment.id,
    fileName: attachment.file_name,
    mimeType: attachment.mime_type,
    publicUrl: attachment.public_url,
  }));
}

export async function deleteAdminAttachment(attachmentId: string) {
  await adminRequest<{ ok: true }>({ action: "delete_attachment", attachmentId });
}

export interface EmailTemplateRow {
  key: string;
  name: string;
  recipient_email: string | null;
  subject_template: string;
  body_template: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function listAdminEmailTemplates() {
  const result = await adminRequest<{ templates: EmailTemplateRow[] }>({
    action: "list_email_templates",
  });
  return result.templates ?? [];
}

export async function upsertAdminEmailTemplate(input: {
  key: string;
  name: string;
  recipient_email?: string | null;
  subject_template: string;
  body_template: string;
  description?: string | null;
  active?: boolean;
}) {
  const result = await adminRequest<{ template: EmailTemplateRow }>({
    action: "upsert_email_template",
    template: input,
  });
  return result.template;
}

export async function deleteAdminEmailTemplate(templateKey: string) {
  await adminRequest<{ ok: true }>({ action: "delete_email_template", templateKey });
}

export async function previewAdminEmailTemplate(input: {
  templateKey?: string;
  template?: {
    subject_template: string;
    body_template: string;
    recipient_email?: string | null;
  };
  emailVariables?: Record<string, string>;
}) {
  const result = await adminRequest<{
    preview: {
      recipient_email: string | null;
      subject: string;
      body: string;
      variables: Record<string, string>;
    };
  }>({
    action: "preview_email_template",
    ...input,
  });
  return result.preview;
}

export async function sendAdminTestEmail(input: {
  testEmail: string;
  templateKey?: string;
  template?: {
    subject_template: string;
    body_template: string;
  };
  emailVariables?: Record<string, string>;
}) {
  return adminRequest<{ ok: true; messageId: string | null }>({
    action: "send_test_email",
    ...input,
  });
}

export async function listAdminFlows() {
  const result = await adminRequest<{ flows: import("./flowDefinitions").FlowDefinitionRow[] }>({
    action: "list_flows",
  });
  return result.flows ?? [];
}

export async function upsertAdminFlow(input: {
  key: string;
  name_bg: string;
  name_en: string;
  description_bg: string;
  description_en: string;
  steps: import("./flowDefinitions").FlowDefinitionRow["steps"];
  active?: boolean;
}) {
  const result = await adminRequest<{ flow: import("./flowDefinitions").FlowDefinitionRow }>({
    action: "upsert_flow",
    flow: input,
  });
  return result.flow;
}

export async function seedAdminFlows() {
  const result = await adminRequest<{
    flows: Array<{ key: string; name_bg: string; name_en: string }>;
    count: number;
  }>({
    action: "seed_flows",
  });
  return result;
}
