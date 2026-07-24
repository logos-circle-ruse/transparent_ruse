import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildResponseReviewUserPrompt,
  finalizeResponseReview,
  parseResponseReviewContent,
  RESPONSE_REVIEW_SYSTEM_PROMPT,
  type GroqResponseReview,
  type ResponseReviewInput,
} from "../_shared/responseReview.ts";
import {
  parseModerationContent,
  type GroqModeration,
} from "../_shared/moderation.ts";
import { DEFAULT_NEIGHBORHOOD_SEED } from "../_shared/neighborhoodSeed.ts";
import { DEFAULT_FLOW_DEFINITIONS } from "../_shared/flowDefinitions.ts";
import {
  renderEmailTemplate,
  SAMPLE_EMAIL_VARIABLES,
  type EmailTemplateVariable,
} from "../_shared/emailTemplates.ts";
import { resolveOrFallback } from "../_shared/text.ts";

type AdminAction =
  | "list_signals"
  | "create_signal"
  | "update_signal"
  | "delete_signal"
  | "add_event"
  | "update_event"
  | "delete_event"
  | "review_response"
  | "simulate_municipality_flow"
  | "list_ai_test_cases"
  | "upsert_ai_test_case"
  | "delete_ai_test_case"
  | "list_ai_test_runs"
  | "run_ai_test"
  | "list_neighborhoods"
  | "upsert_neighborhood"
  | "delete_neighborhood"
  | "seed_neighborhoods"
  | "list_ai_prompts"
  | "upsert_ai_prompt"
  | "delete_ai_prompt"
  | "list_admins"
  | "add_admin"
  | "remove_admin"
  | "upload_attachment"
  | "delete_attachment"
  | "list_email_templates"
  | "upsert_email_template"
  | "delete_email_template"
  | "preview_email_template"
  | "send_test_email"
  | "list_flows"
  | "upsert_flow"
  | "seed_flows";

interface AdminRequestBody {
  action: AdminAction;
  signalId?: string;
  updates?: Record<string, unknown>;
  eventType?: string;
  message?: string;
  actor?: string;
  satisfactory?: boolean;
  signalTitle?: string;
  signalDescription?: string;
  municipalityResponse?: string;

  testCaseId?: string;
  testCase?: {
    id?: string;
    name: string;
    kind: "moderation" | "response_review";
    system_prompt: string;
    user_payload: unknown;
    expected?: unknown;
    notes?: string;
  };

  kind?: "moderation" | "response_review";
  systemPrompt?: string;
  userPayload?: unknown;
  model?: string;
  temperature?: number;

  eventId?: string;
  signal?: {
    title: string;
    description: string;
    district?: string;
    neighborhood_id?: string | null;
    submitter_name?: string;
    status?: string;
    priority?: string;
    ai_moderation_status?: string;
    ai_moderation_reason?: string | null;
  };

  neighborhood?: {
    id: string;
    name_bg: string;
    name_en: string;
    aliases?: string[];
    sort_order?: number;
    active?: boolean;
  };
  neighborhoodId?: string;

  prompt?: {
    key: string;
    kind: "moderation" | "response_review" | "custom";
    title: string;
    description?: string;
    system_prompt: string;
  };
  promptKey?: string;

  adminEmail?: string;
  adminUserId?: string;
  displayName?: string;

  attachmentId?: string;
  templateKey?: string;
  template?: {
    key: string;
    name: string;
    recipient_email?: string | null;
    subject_template: string;
    body_template: string;
    description?: string | null;
    active?: boolean;
  };
  emailVariables?: Partial<Record<EmailTemplateVariable, string>>;
  testEmail?: string;

  flow?: {
    key: string;
    name_bg: string;
    name_en: string;
    description_bg: string;
    description_en: string;
    steps: Array<{
      id: string;
      sort_order: number;
      title_bg: string;
      title_en: string;
      description_bg: string;
      description_en: string;
      actor: "citizen" | "ai" | "municipality" | "system";
      technical_key?: string;
    }>;
    active?: boolean;
  };
  flowKey?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function requireAdmin(request: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = request.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { error: response({ error: "Missing Supabase configuration" }, 500) };
  }

  if (!authHeader) {
    return { error: response({ error: "Missing Authorization header" }, 401) };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return { error: response({ error: "Invalid or expired session" }, 401) };
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminProfile, error: adminError } = await serviceClient
    .from("admin_profiles")
    .select("user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return { error: response({ error: adminError.message }, 500) };
  }

  if (!adminProfile) {
    return { error: response({ error: "Admin access required" }, 403) };
  }

  return { user, userClient, serviceClient, adminProfile };
}

async function reviewResponseWithGroq(
  payload: ResponseReviewInput
): Promise<GroqResponseReview> {
  const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL")?.trim() || null;
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    const fallback = finalizeResponseReview(
      {
        satisfactory: false,
        reason: "GROQ_API_KEY не е конфигуриран. AI медиаторът не може да оцени отговора.",
        suggested_follow_up:
          "Конфигурирайте GROQ_API_KEY в Supabase secrets за автоматична оценка.",
        platform_reply: "",
      },
      payload,
      publicSiteUrl
    );
    return fallback;
  }

  const completion = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: RESPONSE_REVIEW_SYSTEM_PROMPT },
        { role: "user", content: buildResponseReviewUserPrompt(payload, publicSiteUrl) },
      ],
    }),
  });

  if (!completion.ok) {
    return finalizeResponseReview(
      {
        satisfactory: false,
        reason: `Groq върна грешка ${completion.status}. Опитайте отново или прегледайте ръчно.`,
        suggested_follow_up: "Повторете AI оценката или прегледайте отговора ръчно.",
        platform_reply: "",
      },
      payload,
      publicSiteUrl
    );
  }

  const parsed = (await completion.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = parsed.choices?.[0]?.message?.content ?? "{}";
  return finalizeResponseReview(parseResponseReviewContent(content), payload, publicSiteUrl);
}

async function runGroqJson(systemPrompt: string, userPrompt: string, model: string, temperature: number) {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    return {
      ok: false,
      error: "GROQ_API_KEY not configured.",
      raw: null as string | null,
    };
  }

  const completion = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!completion.ok) {
    return {
      ok: false,
      error: `Groq call failed with status ${completion.status}.`,
      raw: null as string | null,
    };
  }

  const parsed = (await completion.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return {
    ok: true,
    error: null as string | null,
    raw: parsed.choices?.[0]?.message?.content ?? "{}",
  };
}

const ALLOWED_SIGNAL_UPDATES = new Set([
  "title",
  "description",
  "district",
  "neighborhood_id",
  "status",
  "priority",
  "submitter_name",
  "ai_moderation_status",
  "ai_moderation_reason",
  "upvotes",
  "downvotes",
]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return response({ error: "Method Not Allowed" }, 405);
  }

  const authResult = await requireAdmin(request);
  if ("error" in authResult && authResult.error) {
    return authResult.error;
  }

  const { userClient, serviceClient } = authResult;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const action = String(formData.get("action") ?? "");

    if (action === "upload_attachment") {
      const signalId = String(formData.get("signalId") ?? "");
      if (!signalId) {
        return response({ error: "signalId is required" }, 400);
      }

      const files = formData
        .getAll("attachments")
        .filter((entry): entry is File => entry instanceof File);

      const singleFile = formData.get("attachment");
      if (singleFile instanceof File) {
        files.push(singleFile);
      }

      if (files.length === 0) {
        return response({ error: "attachment file is required" }, 400);
      }

      const { data: signalRow, error: signalError } = await userClient
        .from("signals")
        .select("id")
        .eq("id", signalId)
        .maybeSingle();

      if (signalError) {
        return response({ error: signalError.message }, 500);
      }

      if (!signalRow) {
        return response({ error: "Signal not found" }, 404);
      }

      const bucketName = Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "signal-attachments";
      const uploaded: Array<{
        id: string;
        file_name: string;
        mime_type: string;
        public_url: string;
        size_bytes: number;
      }> = [];

      for (const file of files) {
        const storagePath = `${signalId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        const uploadResult = await serviceClient.storage.from(bucketName).upload(storagePath, fileBytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

        if (uploadResult.error) {
          return response({ error: uploadResult.error.message }, 500);
        }

        const { data: publicData } = serviceClient.storage.from(bucketName).getPublicUrl(storagePath);
        const { data: inserted, error: insertError } = await userClient
          .from("signal_attachments")
          .insert({
            signal_id: signalId,
            storage_path: storagePath,
            file_name: file.name,
            mime_type: file.type || "application/octet-stream",
            size_bytes: file.size,
            public_url: publicData.publicUrl,
          })
          .select("id,file_name,mime_type,public_url,size_bytes")
          .single();

        if (insertError) {
          await serviceClient.storage.from(bucketName).remove([storagePath]);
          return response({ error: insertError.message }, 500);
        }

        uploaded.push(inserted);
      }

      return response({ attachments: uploaded });
    }

    return response({ error: `Unknown multipart action: ${action}` }, 400);
  }

  const body = (await request.json()) as AdminRequestBody;

  if (body.action === "list_ai_test_cases") {
    const { data, error } = await userClient
      .from("ai_test_cases")
      .select("id,name,kind,system_prompt,user_payload,expected,notes,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ cases: data ?? [] });
  }

  if (body.action === "upsert_ai_test_case") {
    if (!body.testCase) {
      return response({ error: "testCase is required" }, 400);
    }

    const payload = {
      id: body.testCase.id,
      name: body.testCase.name,
      kind: body.testCase.kind,
      system_prompt: body.testCase.system_prompt,
      user_payload: body.testCase.user_payload ?? {},
      expected: body.testCase.expected ?? null,
      notes: body.testCase.notes ?? null,
    };

    const { data, error } = await userClient
      .from("ai_test_cases")
      .upsert(payload)
      .select("id,name,kind,system_prompt,user_payload,expected,notes,created_at,updated_at")
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ testCase: data });
  }

  if (body.action === "delete_ai_test_case") {
    if (!body.testCaseId) {
      return response({ error: "testCaseId is required" }, 400);
    }

    const { error } = await userClient.from("ai_test_cases").delete().eq("id", body.testCaseId);
    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ ok: true });
  }

  if (body.action === "list_ai_test_runs") {
    const { data, error } = await userClient
      .from("ai_test_runs")
      .select("id,test_case_id,kind,model,temperature,ok,error,created_at,parsed_output")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ runs: data ?? [] });
  }

  if (body.action === "run_ai_test") {
    const kind = body.kind;
    const systemPrompt = body.systemPrompt?.trim();
    const userPayload = body.userPayload ?? {};

    if (!kind || !systemPrompt) {
      return response({ error: "kind and systemPrompt are required" }, 400);
    }

    const model = body.model?.trim() || "llama-3.3-70b-versatile";
    const temperature = typeof body.temperature === "number" ? body.temperature : 0.1;

    let userPrompt = "";
    let parsedOutput: unknown = null;
    let ok = false;
    let errorMessage: string | null = null;
    let rawOutput: string | null = null;

    if (kind === "response_review") {
      const input = userPayload as Partial<ResponseReviewInput>;
      if (!input.signalTitle?.trim() || !input.signalDescription?.trim() || !input.municipalityResponse?.trim()) {
        return response(
          { error: "userPayload must include signalTitle, signalDescription, municipalityResponse" },
          400
        );
      }

      userPrompt = buildResponseReviewUserPrompt({
        signalTitle: input.signalTitle.trim(),
        signalDescription: input.signalDescription.trim(),
        municipalityResponse: input.municipalityResponse.trim(),
      }, Deno.env.get("PUBLIC_SITE_URL")?.trim() || null);

      const groq = await runGroqJson(systemPrompt, userPrompt, model, temperature);
      rawOutput = groq.raw;
      if (!groq.ok || !rawOutput) {
        ok = false;
        errorMessage = groq.error ?? "Groq failed.";
        parsedOutput = null;
      } else {
        const parsed = parseResponseReviewContent(rawOutput);
        parsedOutput = finalizeResponseReview(parsed, {
          signalTitle: input.signalTitle.trim(),
          signalDescription: input.signalDescription.trim(),
          municipalityResponse: input.municipalityResponse.trim(),
        }, Deno.env.get("PUBLIC_SITE_URL")?.trim() || null);
        ok = true;
      }
    } else {
      const input = userPayload as { title?: string; description?: string; district?: string };
      if (!input.title?.trim() || !input.description?.trim()) {
        return response({ error: "userPayload must include title and description" }, 400);
      }

      userPrompt = `Title: ${input.title}\nDescription: ${input.description}\nDistrict: ${input.district ?? "Unknown"}`;

      const groq = await runGroqJson(systemPrompt, userPrompt, model, temperature);
      rawOutput = groq.raw;
      if (!groq.ok || !rawOutput) {
        ok = false;
        errorMessage = groq.error ?? "Groq failed.";
        parsedOutput = null;
      } else {
        parsedOutput = parseModerationContent(rawOutput) as GroqModeration;
        ok = true;
      }
    }

    const { data: insertedRun, error: insertError } = await userClient
      .from("ai_test_runs")
      .insert({
        test_case_id: body.testCaseId ?? null,
        kind,
        model,
        temperature,
        system_prompt: systemPrompt,
        user_payload: userPayload,
        raw_output: rawOutput,
        parsed_output: parsedOutput,
        ok,
        error: errorMessage,
      })
      .select("id,kind,ok,error,created_at,raw_output,parsed_output")
      .single();

    if (insertError) {
      return response({ error: insertError.message }, 500);
    }

    return response({ run: insertedRun });
  }

  if (body.action === "list_signals") {
    const { data, error } = await userClient
      .from("signals")
      .select(
        "id,title,description,district,neighborhood_id,submitter_name,status,priority,upvotes,downvotes,ai_moderation_status,ai_moderation_reason,created_at,updated_at,signal_attachments(id,file_name,mime_type,public_url),signal_events(id,event_type,payload,created_at)"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ signals: data ?? [] });
  }

  if (body.action === "update_signal") {
    if (!body.signalId || !body.updates) {
      return response({ error: "signalId and updates are required" }, 400);
    }

    const sanitizedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body.updates)) {
      if (ALLOWED_SIGNAL_UPDATES.has(key)) {
        sanitizedUpdates[key] = value;
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return response({ error: "No valid update fields provided" }, 400);
    }

    const { data, error } = await userClient
      .from("signals")
      .update(sanitizedUpdates)
      .eq("id", body.signalId)
      .select(
        "id,title,description,district,neighborhood_id,submitter_name,status,priority,upvotes,downvotes,ai_moderation_status,ai_moderation_reason,created_at,updated_at"
      )
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ signal: data });
  }

  if (body.action === "add_event") {
    if (!body.signalId || !body.eventType || !body.message?.trim()) {
      return response({ error: "signalId, eventType, and message are required" }, 400);
    }

    const payload: Record<string, unknown> = {
      actor: body.actor ?? "system",
      message: body.message.trim(),
    };

    if (typeof body.satisfactory === "boolean") {
      payload.satisfactory = body.satisfactory;
    }

    const { data, error } = await userClient
      .from("signal_events")
      .insert({
        signal_id: body.signalId,
        event_type: body.eventType,
        payload,
      })
      .select("id,event_type,payload,created_at")
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ event: data });
  }

  if (body.action === "review_response") {
    if (!body.signalTitle?.trim() || !body.signalDescription?.trim() || !body.municipalityResponse?.trim()) {
      return response(
        { error: "signalTitle, signalDescription, and municipalityResponse are required" },
        400
      );
    }

    const review = await reviewResponseWithGroq({
      signalTitle: body.signalTitle.trim(),
      signalDescription: body.signalDescription.trim(),
      municipalityResponse: body.municipalityResponse.trim(),
    });

    return response({ review });
  }

  if (body.action === "simulate_municipality_flow") {
    if (!body.signalId || !body.municipalityResponse?.trim()) {
      return response({ error: "signalId and municipalityResponse are required" }, 400);
    }

    const { data: signal, error: signalError } = await userClient
      .from("signals")
      .select("id,title,description,status")
      .eq("id", body.signalId)
      .single();

    if (signalError || !signal) {
      return response({ error: signalError?.message ?? "Signal not found" }, 404);
    }

    const municipalityMessage = body.municipalityResponse.trim();
    const review = await reviewResponseWithGroq({
      signalTitle: signal.title,
      signalDescription: signal.description,
      municipalityResponse: municipalityMessage,
    });

    const { data: municipalityEvent, error: municipalityEventError } = await userClient
      .from("signal_events")
      .insert({
        signal_id: body.signalId,
        event_type: "municipality_response",
        payload: {
          actor: "municipality",
          message: municipalityMessage,
        },
      })
      .select("id,event_type,payload,created_at")
      .single();

    if (municipalityEventError) {
      return response({ error: municipalityEventError.message }, 500);
    }

    const reviewMessage = review.satisfactory
      ? `AI оценка: отговорът е задоволителен. ${review.reason}`
      : `AI оценка: отговорът не е задоволителен. ${review.reason}${
          review.suggested_follow_up ? ` Препоръка: ${review.suggested_follow_up}` : ""
        }`;

    const { data: reviewEvent, error: reviewEventError } = await userClient
      .from("signal_events")
      .insert({
        signal_id: body.signalId,
        event_type: "ai_response_review",
        payload: {
          actor: "ai",
          message: reviewMessage,
          satisfactory: review.satisfactory,
        },
      })
      .select("id,event_type,payload,created_at")
      .single();

    if (reviewEventError) {
      return response({ error: reviewEventError.message }, 500);
    }

    const { data: platformEvent, error: platformEventError } = await userClient
      .from("signal_events")
      .insert({
        signal_id: body.signalId,
        event_type: "platform_follow_up",
        payload: {
          actor: "system",
          message: review.platform_reply,
          satisfactory: review.satisfactory,
        },
      })
      .select("id,event_type,payload,created_at")
      .single();

    if (platformEventError) {
      return response({ error: platformEventError.message }, 500);
    }

    const nextStatus = review.satisfactory ? "Resolved" : "No Response";
    const { data: updatedSignal, error: updateError } = await userClient
      .from("signals")
      .update({ status: nextStatus })
      .eq("id", body.signalId)
      .select("id,status,updated_at")
      .single();

    if (updateError) {
      return response({ error: updateError.message }, 500);
    }

    return response({
      review,
      municipalityEvent,
      reviewEvent,
      platformEvent,
      signal: updatedSignal,
    });
  }

  if (body.action === "create_signal") {
    if (!body.signal?.title?.trim() || !body.signal.description?.trim()) {
      return response({ error: "signal.title and signal.description are required" }, 400);
    }

    const district = resolveOrFallback(body.signal.district, "Unknown");
    const submitterName = resolveOrFallback(body.signal.submitter_name, "Anonymous");

    const { data: inserted, error } = await userClient
      .from("signals")
      .insert({
        title: body.signal.title.trim(),
        description: body.signal.description.trim(),
        district,
        neighborhood_id: body.signal.neighborhood_id ?? null,
        submitter_name: submitterName,
        status: body.signal.status ?? "Pending",
        priority: body.signal.priority ?? "Normal",
        ai_moderation_status: body.signal.ai_moderation_status ?? "approved",
        ai_moderation_reason: body.signal.ai_moderation_reason ?? null,
      })
      .select(
        "id,title,description,district,neighborhood_id,submitter_name,status,priority,upvotes,downvotes,ai_moderation_status,ai_moderation_reason,created_at,updated_at"
      )
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    await userClient.from("signal_events").insert([
      {
        signal_id: inserted.id,
        event_type: "original_signal",
        payload: { actor: "citizen", message: inserted.description },
      },
      {
        signal_id: inserted.id,
        event_type: "submitted_to_municipality",
        payload: {
          actor: "system",
          message: `Signal created in admin portal for district: ${district}.`,
        },
      },
    ]);

    return response({ signal: inserted });
  }

  if (body.action === "delete_signal") {
    if (!body.signalId) {
      return response({ error: "signalId is required" }, 400);
    }

    const { error } = await userClient.from("signals").delete().eq("id", body.signalId);
    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ ok: true });
  }

  if (body.action === "update_event") {
    if (!body.eventId) {
      return response({ error: "eventId is required" }, 400);
    }

    const updates: Record<string, unknown> = {};
    if (body.eventType) updates.event_type = body.eventType;

    const payload: Record<string, unknown> = {};
    if (body.actor) payload.actor = body.actor;
    if (body.message?.trim()) payload.message = body.message.trim();
    if (typeof body.satisfactory === "boolean") payload.satisfactory = body.satisfactory;
    if (Object.keys(payload).length > 0) updates.payload = payload;

    const { data, error } = await userClient
      .from("signal_events")
      .update(updates)
      .eq("id", body.eventId)
      .select("id,event_type,payload,created_at")
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ event: data });
  }

  if (body.action === "delete_event") {
    if (!body.eventId) {
      return response({ error: "eventId is required" }, 400);
    }

    const { error } = await userClient.from("signal_events").delete().eq("id", body.eventId);
    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ ok: true });
  }

  if (body.action === "list_neighborhoods") {
    const { data, error } = await userClient
      .from("neighborhoods")
      .select("id,name_bg,name_en,aliases,sort_order,active,created_at,updated_at")
      .order("sort_order", { ascending: true });

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ neighborhoods: data ?? [] });
  }

  if (body.action === "upsert_neighborhood") {
    if (!body.neighborhood?.id || !body.neighborhood.name_bg || !body.neighborhood.name_en) {
      return response({ error: "neighborhood id, name_bg, name_en are required" }, 400);
    }

    const { data, error } = await userClient
      .from("neighborhoods")
      .upsert({
        id: body.neighborhood.id,
        name_bg: body.neighborhood.name_bg,
        name_en: body.neighborhood.name_en,
        aliases: body.neighborhood.aliases ?? [],
        sort_order: body.neighborhood.sort_order ?? 0,
        active: body.neighborhood.active ?? true,
      })
      .select("id,name_bg,name_en,aliases,sort_order,active,created_at,updated_at")
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ neighborhood: data });
  }

  if (body.action === "delete_neighborhood") {
    if (!body.neighborhoodId) {
      return response({ error: "neighborhoodId is required" }, 400);
    }

    const { error } = await userClient.from("neighborhoods").delete().eq("id", body.neighborhoodId);
    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ ok: true });
  }

  if (body.action === "seed_neighborhoods") {
    const rows = DEFAULT_NEIGHBORHOOD_SEED.map((row, index) => ({
      id: row.id,
      name_bg: row.name_bg,
      name_en: row.name_en,
      aliases: row.aliases ?? [],
      sort_order: row.sort_order ?? index,
      active: true,
    }));

    const { data, error } = await userClient
      .from("neighborhoods")
      .upsert(rows)
      .select("id,name_bg,name_en");

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ neighborhoods: data ?? [], count: data?.length ?? 0 });
  }

  if (body.action === "list_ai_prompts") {
    const { data, error } = await userClient
      .from("ai_prompt_configs")
      .select("key,kind,title,description,system_prompt,created_at,updated_at")
      .order("key", { ascending: true });

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ prompts: data ?? [] });
  }

  if (body.action === "upsert_ai_prompt") {
    if (!body.prompt?.key || !body.prompt.title || !body.prompt.system_prompt) {
      return response({ error: "prompt key, title, system_prompt are required" }, 400);
    }

    const { data, error } = await userClient
      .from("ai_prompt_configs")
      .upsert({
        key: body.prompt.key,
        kind: body.prompt.kind,
        title: body.prompt.title,
        description: body.prompt.description ?? null,
        system_prompt: body.prompt.system_prompt,
      })
      .select("key,kind,title,description,system_prompt,created_at,updated_at")
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ prompt: data });
  }

  if (body.action === "delete_ai_prompt") {
    if (!body.promptKey) {
      return response({ error: "promptKey is required" }, 400);
    }

    const { error } = await userClient.from("ai_prompt_configs").delete().eq("key", body.promptKey);
    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ ok: true });
  }

  if (body.action === "list_admins") {
    const { data, error } = await userClient
      .from("admin_profiles")
      .select("user_id,display_name,created_at")
      .order("created_at", { ascending: true });

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ admins: data ?? [] });
  }

  if (body.action === "add_admin") {
    if (!body.adminEmail?.trim()) {
      return response({ error: "adminEmail is required" }, 400);
    }

    const email = body.adminEmail.trim().toLowerCase();
    const { data: listed, error: listError } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      return response({ error: listError.message }, 500);
    }

    const matchedUser = listed.users.find((user) => user.email?.toLowerCase() === email);
    if (!matchedUser) {
      return response({ error: "No Supabase Auth user found for that email" }, 404);
    }

    const { data, error } = await serviceClient
      .from("admin_profiles")
      .upsert({
        user_id: matchedUser.id,
        display_name: body.displayName?.trim() || matchedUser.email,
      })
      .select("user_id,display_name,created_at")
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ admin: data });
  }

  if (body.action === "remove_admin") {
    if (!body.adminUserId) {
      return response({ error: "adminUserId is required" }, 400);
    }

    const { error } = await serviceClient
      .from("admin_profiles")
      .delete()
      .eq("user_id", body.adminUserId);

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ ok: true });
  }

  if (body.action === "delete_attachment") {
    if (!body.attachmentId) {
      return response({ error: "attachmentId is required" }, 400);
    }

    const { data: attachment, error: fetchError } = await userClient
      .from("signal_attachments")
      .select("id,storage_path")
      .eq("id", body.attachmentId)
      .maybeSingle();

    if (fetchError) {
      return response({ error: fetchError.message }, 500);
    }

    if (!attachment) {
      return response({ error: "Attachment not found" }, 404);
    }

    const bucketName = Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "signal-attachments";
    const { error: storageError } = await serviceClient.storage
      .from(bucketName)
      .remove([attachment.storage_path]);

    if (storageError) {
      return response({ error: storageError.message }, 500);
    }

    const { error: deleteError } = await userClient
      .from("signal_attachments")
      .delete()
      .eq("id", body.attachmentId);

    if (deleteError) {
      return response({ error: deleteError.message }, 500);
    }

    return response({ ok: true });
  }

  if (body.action === "list_email_templates") {
    const { data, error } = await userClient
      .from("email_templates")
      .select("key,name,recipient_email,subject_template,body_template,description,active,created_at,updated_at")
      .order("key", { ascending: true });

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ templates: data ?? [] });
  }

  if (body.action === "upsert_email_template") {
    if (!body.template?.key || !body.template.name || !body.template.subject_template || !body.template.body_template) {
      return response({ error: "template key, name, subject_template, body_template are required" }, 400);
    }

    const { data, error } = await userClient
      .from("email_templates")
      .upsert({
        key: body.template.key,
        name: body.template.name,
        recipient_email: body.template.recipient_email ?? null,
        subject_template: body.template.subject_template,
        body_template: body.template.body_template,
        description: body.template.description ?? null,
        active: body.template.active ?? true,
      })
      .select("key,name,recipient_email,subject_template,body_template,description,active,created_at,updated_at")
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ template: data });
  }

  if (body.action === "delete_email_template") {
    if (!body.templateKey) {
      return response({ error: "templateKey is required" }, 400);
    }

    const { error } = await userClient.from("email_templates").delete().eq("key", body.templateKey);
    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ ok: true });
  }

  if (body.action === "preview_email_template") {
    const variables = { ...SAMPLE_EMAIL_VARIABLES, ...(body.emailVariables ?? {}) };
    let subjectTemplate = body.template?.subject_template;
    let bodyTemplate = body.template?.body_template;
    let recipientEmail = body.template?.recipient_email ?? null;

    if (body.templateKey) {
      const { data, error } = await userClient
        .from("email_templates")
        .select("recipient_email,subject_template,body_template")
        .eq("key", body.templateKey)
        .maybeSingle();

      if (error) {
        return response({ error: error.message }, 500);
      }

      if (!data) {
        return response({ error: "Email template not found" }, 404);
      }

      subjectTemplate = data.subject_template;
      bodyTemplate = data.body_template;
      recipientEmail = data.recipient_email;
    }

    if (!subjectTemplate || !bodyTemplate) {
      return response({ error: "templateKey or inline template is required" }, 400);
    }

    return response({
      preview: {
        recipient_email: recipientEmail,
        subject: renderEmailTemplate(subjectTemplate, variables),
        body: renderEmailTemplate(bodyTemplate, variables),
        variables,
      },
    });
  }

  if (body.action === "send_test_email") {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return response({ error: "RESEND_API_KEY is not configured" }, 503);
    }

    const toEmail = body.testEmail?.trim();
    if (!toEmail) {
      return response({ error: "testEmail is required" }, 400);
    }

    const variables = { ...SAMPLE_EMAIL_VARIABLES, ...(body.emailVariables ?? {}) };
    let subjectTemplate = body.template?.subject_template;
    let bodyTemplate = body.template?.body_template;

    if (body.templateKey) {
      const { data, error } = await userClient
        .from("email_templates")
        .select("subject_template,body_template,active")
        .eq("key", body.templateKey)
        .maybeSingle();

      if (error) {
        return response({ error: error.message }, 500);
      }

      if (!data) {
        return response({ error: "Email template not found" }, 404);
      }

      if (!data.active) {
        return response({ error: "Email template is inactive" }, 400);
      }

      subjectTemplate = data.subject_template;
      bodyTemplate = data.body_template;
    }

    if (!subjectTemplate || !bodyTemplate) {
      return response({ error: "templateKey or inline template is required" }, 400);
    }

    const sendResult = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Transparent Ruse <onboarding@resend.dev>",
        to: [toEmail],
        subject: renderEmailTemplate(subjectTemplate, variables),
        text: renderEmailTemplate(bodyTemplate, variables),
      }),
    });

    const sendPayload = (await sendResult.json()) as { id?: string; message?: string };
    if (!sendResult.ok) {
      return response({ error: sendPayload.message ?? "Failed to send test email" }, 500);
    }

    return response({ ok: true, messageId: sendPayload.id ?? null });
  }

  if (body.action === "list_flows") {
    const { data, error } = await userClient
      .from("flow_definitions")
      .select("key,name_bg,name_en,description_bg,description_en,steps,active,created_at,updated_at")
      .order("key", { ascending: true });

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ flows: data ?? [] });
  }

  if (body.action === "upsert_flow") {
    if (
      !body.flow?.key ||
      !body.flow.name_bg ||
      !body.flow.name_en ||
      !body.flow.description_bg ||
      !body.flow.description_en ||
      !Array.isArray(body.flow.steps)
    ) {
      return response({ error: "flow key, names, descriptions, and steps are required" }, 400);
    }

    const { data, error } = await userClient
      .from("flow_definitions")
      .upsert({
        key: body.flow.key,
        name_bg: body.flow.name_bg,
        name_en: body.flow.name_en,
        description_bg: body.flow.description_bg,
        description_en: body.flow.description_en,
        steps: body.flow.steps,
        active: body.flow.active ?? true,
      })
      .select("key,name_bg,name_en,description_bg,description_en,steps,active,created_at,updated_at")
      .single();

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ flow: data });
  }

  if (body.action === "seed_flows") {
    const rows = DEFAULT_FLOW_DEFINITIONS.map((flow) => ({
      key: flow.key,
      name_bg: flow.name_bg,
      name_en: flow.name_en,
      description_bg: flow.description_bg,
      description_en: flow.description_en,
      steps: flow.steps,
      active: true,
    }));

    const { data, error } = await userClient
      .from("flow_definitions")
      .upsert(rows)
      .select("key,name_bg,name_en");

    if (error) {
      return response({ error: error.message }, 500);
    }

    return response({ flows: data ?? [], count: data?.length ?? 0 });
  }

  return response({ error: `Unknown action: ${body.action}` }, 400);
});
