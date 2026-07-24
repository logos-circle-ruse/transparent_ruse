import { createClient } from "npm:@supabase/supabase-js@2";
import {
  MODERATION_SYSTEM_PROMPT,
  buildFormattedLetterBody,
  buildModerationUserPrompt,
  findDuplicateSignal,
  parseModerationContent,
  resolveSubmittedDescription,
  type GroqModeration,
  type ModerationInput,
} from "../_shared/moderation.ts";
import { resolveOrFallback } from "../_shared/text.ts";

interface IntakePayload extends ModerationInput {
  turnstileToken?: string;
  mode?: "preview" | "submit";
  previewId?: string;
  descriptionChoice?: "formatted" | "original";
}

interface SignalTimelineSeed {
  event_type:
    | "original_signal"
    | "ai_summary"
    | "submitted_to_municipality";
  payload: {
    actor: "citizen" | "ai" | "system";
    message: string;
  };
}

interface ParsedSubmission {
  payload: IntakePayload;
  attachments: File[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PREVIEW_TTL_MINUTES = 30;

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

async function parseSubmission(request: Request): Promise<ParsedSubmission> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const choice = String(formData.get("descriptionChoice") ?? "");
    const payload: IntakePayload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      district: String(formData.get("district") ?? ""),
      submitterName: String(formData.get("submitterName") ?? ""),
      turnstileToken: String(formData.get("turnstileToken") ?? ""),
      mode: String(formData.get("mode") ?? "submit") === "preview" ? "preview" : "submit",
      previewId: String(formData.get("previewId") ?? "") || undefined,
      descriptionChoice: choice === "original" ? "original" : choice === "formatted" ? "formatted" : undefined,
    };

    const attachments = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File);

    return { payload, attachments };
  }

  const payload = (await request.json()) as IntakePayload;
  return { payload, attachments: [] };
}

async function verifyTurnstile(token?: string) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);

  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: form,
    }
  );
  const parsed = (await result.json()) as { success?: boolean };
  return Boolean(parsed.success);
}

function getPublicSiteUrl() {
  return Deno.env.get("PUBLIC_SITE_URL")?.trim() || null;
}

function toModerationInput(payload: IntakePayload): ModerationInput {
  const publicSiteUrl = getPublicSiteUrl();
  return {
    title: payload.title,
    description: payload.description,
    district: payload.district,
    submitterName: payload.submitterName,
    publicSiteUrl: publicSiteUrl ?? undefined,
  };
}

function buildFallbackModeration(payload: ModerationInput, reason: string): GroqModeration {
  const districtLine = payload.district?.trim()
    ? `Квартал/локация: ${payload.district.trim()}.`
    : "Квартал/локация: неуточнена.";

  return {
    decision: "approved",
    reason,
    duplicate_hint: "none",
    formatted_title: payload.title.trim(),
    formatted_description: buildFormattedLetterBody(payload, [payload.description.trim(), districtLine]),
    allow_original: true,
    summary: payload.description.slice(0, 180),
  };
}

async function moderateSignalWithGroq(payload: ModerationInput): Promise<GroqModeration> {
  const publicSiteUrl = getPublicSiteUrl();
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    return buildFallbackModeration(
      payload,
      "GROQ_API_KEY не е конфигуриран. Сигналът е приет по резервна политика."
    );
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
        {
          role: "system",
          content: MODERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildModerationUserPrompt(payload),
        },
      ],
    }),
  });

  if (!completion.ok) {
    return buildFallbackModeration(
      payload,
      `Groq върна грешка ${completion.status}. Сигналът е приет по резервна политика.`
    );
  }

  const parsed = (await completion.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = parsed.choices?.[0]?.message?.content ?? "{}";

  return parseModerationContent(content, payload, publicSiteUrl);
}

async function purgeExpiredPreviewSessions(supabase: ReturnType<typeof createClient>) {
  await supabase
    .from("intake_preview_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return response({ error: "Method Not Allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return response(
      { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY configuration" },
      500
    );
  }

  const { payload, attachments } = await parseSubmission(request);
  if (!payload.title?.trim() || !payload.description?.trim()) {
    return response({ error: "Missing required fields: title, description" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  await purgeExpiredPreviewSessions(supabase);

  if (payload.mode === "preview") {
    const moderation = await moderateSignalWithGroq(toModerationInput(payload));

    if (moderation.decision === "rejected") {
      return response(
        {
          error: "Signal rejected by moderation policy",
          moderation_reason: moderation.reason,
          moderation,
        },
        422
      );
    }

    const expiresAt = new Date(Date.now() + PREVIEW_TTL_MINUTES * 60 * 1000).toISOString();
    const { data: previewSession, error: previewError } = await supabase
      .from("intake_preview_sessions")
      .insert({
        title: payload.title.trim(),
        description: payload.description.trim(),
        district: payload.district?.trim() || null,
        submitter_name: payload.submitterName?.trim() || null,
        moderation,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (previewError || !previewSession) {
      return response({ error: previewError?.message ?? "Failed to store preview session" }, 500);
    }

    return response({
      message: "Moderation preview ready",
      preview_id: previewSession.id,
      moderation,
    });
  }

  const turnstilePassed = await verifyTurnstile(payload.turnstileToken);
  if (!turnstilePassed) {
    return response({ error: "Turnstile verification failed" }, 403);
  }

  if (!payload.previewId) {
    return response({ error: "previewId is required. Run AI preview before submitting." }, 400);
  }

  if (!payload.descriptionChoice) {
    return response({ error: "descriptionChoice is required (formatted or original)" }, 400);
  }

  const { data: previewSession, error: previewLoadError } = await supabase
    .from("intake_preview_sessions")
    .select("id,title,description,district,submitter_name,moderation,expires_at")
    .eq("id", payload.previewId)
    .maybeSingle();

  if (previewLoadError) {
    return response({ error: previewLoadError.message }, 500);
  }

  if (!previewSession) {
    return response({ error: "Preview session not found or expired. Please run AI review again." }, 410);
  }

  if (new Date(previewSession.expires_at).getTime() < Date.now()) {
    await supabase.from("intake_preview_sessions").delete().eq("id", previewSession.id);
    return response({ error: "Preview session expired. Please run AI review again." }, 410);
  }

  if (
    previewSession.title !== payload.title.trim() ||
    previewSession.description !== payload.description.trim()
  ) {
    return response(
      { error: "Signal text changed after preview. Please run AI review again." },
      409
    );
  }

  const moderation = previewSession.moderation as GroqModeration;
  if (moderation.decision === "rejected") {
    return response({ error: "Preview session is rejected and cannot be submitted." }, 422);
  }

  let resolvedSubmission;
  try {
    resolvedSubmission = resolveSubmittedDescription(moderation, payload, payload.descriptionChoice);
  } catch (resolveError) {
    return response(
      {
        error: resolveError instanceof Error ? resolveError.message : "Invalid description choice",
      },
      422
    );
  }

  const resolvedDistrict = resolveOrFallback(payload.district, "Unknown");
  const resolvedSubmitterName = resolveOrFallback(payload.submitterName, "Anonymous");

  const { data: duplicateCandidate } = await supabase
    .from("signals")
    .select("id,title,description")
    .eq("district", resolvedDistrict)
    .order("created_at", { ascending: false })
    .limit(20);

  const duplicate = findDuplicateSignal(duplicateCandidate ?? [], payload);

  const { data: inserted, error } = await supabase
    .from("signals")
    .insert({
      title: resolvedSubmission.title,
      description: resolvedSubmission.description,
      original_description: payload.description.trim(),
      description_source: resolvedSubmission.source,
      district: resolvedDistrict,
      submitter_name: resolvedSubmitterName,
      status: "Pending",
      ai_moderation_status: "approved",
      ai_moderation_reason: moderation.reason,
      duplicate_of_signal_id: duplicate?.id ?? null,
    })
    .select("id,title,status,created_at")
    .single();

  if (error) {
    return response({ error: error.message }, 500);
  }

  await supabase.from("intake_preview_sessions").delete().eq("id", previewSession.id);

  const timelineSeed: SignalTimelineSeed[] = [
    {
      event_type: "original_signal",
      payload: {
        actor: "citizen",
        message: payload.description.trim(),
      },
    },
    {
      event_type: "ai_summary",
      payload: {
        actor: "ai",
        message: moderation.summary,
      },
    },
    {
      event_type: "submitted_to_municipality",
      payload: {
        actor: "system",
        message:
          resolvedSubmission.source === "formatted"
            ? `Сигналът е изпратен към общината с AI-форматиран официален текст (квартал: ${resolvedDistrict}).`
            : `Сигналът е изпратен към общината с оригиналния текст на подателя (квартал: ${resolvedDistrict}).`,
      },
    },
  ];

  await supabase.from("signal_events").insert(
    timelineSeed.map((event) => ({
      signal_id: inserted.id,
      event_type: event.event_type,
      payload: event.payload,
    }))
  );

  const bucketName = Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "signal-attachments";
  const uploadedFiles: Array<{ file_name: string; public_url: string; size_bytes: number }> = [];
  if (attachments.length > 0) {
    for (const file of attachments) {
      const storagePath = `${inserted.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const uploadResult = await supabase.storage.from(bucketName).upload(storagePath, fileBytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

      if (uploadResult.error) {
        continue;
      }

      const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
      uploadedFiles.push({
        file_name: file.name,
        public_url: publicData.publicUrl,
        size_bytes: file.size,
      });

      await supabase.from("signal_attachments").insert({
        signal_id: inserted.id,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        public_url: publicData.publicUrl,
      });
    }
  }

  return response(
    {
      message: "Signal accepted and stored",
      moderation,
      description_source: resolvedSubmission.source,
      signal: inserted,
      attachments: uploadedFiles,
      duplicate_of_signal_id: duplicate?.id ?? null,
    },
    202
  );
});
