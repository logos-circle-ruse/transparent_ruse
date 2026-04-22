import { createClient } from "npm:@supabase/supabase-js@2";

interface IntakePayload {
  title: string;
  description: string;
  district?: string;
  submitterName?: string;
  turnstileToken?: string;
}

interface GroqModeration {
  decision: "approved" | "rejected";
  reason: string;
  duplicate_hint: string;
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
    const payload: IntakePayload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      district: String(formData.get("district") ?? ""),
      submitterName: String(formData.get("submitterName") ?? ""),
      turnstileToken: String(formData.get("turnstileToken") ?? ""),
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

async function moderateSignalWithGroq(payload: IntakePayload): Promise<GroqModeration> {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    return {
      decision: "approved",
      reason: "GROQ_API_KEY not configured. Accepted by fallback policy.",
      duplicate_hint: "none",
    };
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
          content:
            "You are a civic moderation assistant. Return JSON with keys: decision, reason, duplicate_hint. decision must be approved or rejected.",
        },
        {
          role: "user",
          content: `Title: ${payload.title}\nDescription: ${payload.description}\nDistrict: ${payload.district ?? "Unknown"}\nSubmitter: ${payload.submitterName ?? "Anonymous"}`,
        },
      ],
    }),
  });

  if (!completion.ok) {
    return {
      decision: "approved",
      reason: `Groq call failed with status ${completion.status}. Accepted by fallback policy.`,
      duplicate_hint: "unknown",
    };
  }

  const parsed = (await completion.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = parsed.choices?.[0]?.message?.content ?? "{}";
  const normalized = JSON.parse(content) as GroqModeration;

  return {
    decision: normalized.decision === "rejected" ? "rejected" : "approved",
    reason: normalized.reason ?? "No reason provided by model.",
    duplicate_hint: normalized.duplicate_hint ?? "none",
  };
}

async function summarizeSignalWithGroq(payload: IntakePayload): Promise<string> {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    return payload.description.slice(0, 220);
  }

  const completion = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You summarize civic issue reports. Return only one concise sentence in plain text.",
        },
        {
          role: "user",
          content: `Title: ${payload.title}\nDescription: ${payload.description}`,
        },
      ],
    }),
  });

  if (!completion.ok) {
    return payload.description.slice(0, 220);
  }

  const parsed = (await completion.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parsed.choices?.[0]?.message?.content?.trim() || payload.description.slice(0, 220);
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

  const turnstilePassed = await verifyTurnstile(payload.turnstileToken);
  if (!turnstilePassed) {
    return response({ error: "Turnstile verification failed" }, 403);
  }

  const moderation = await moderateSignalWithGroq(payload);
  if (moderation.decision === "rejected") {
    return response(
      {
        error: "Signal rejected by moderation policy",
        moderation_reason: moderation.reason,
      },
      422
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const aiSummary = await summarizeSignalWithGroq(payload);

  const { data: duplicateCandidate } = await supabase
    .from("signals")
    .select("id,title,description")
    .eq("district", payload.district ?? null)
    .order("created_at", { ascending: false })
    .limit(20);

  const duplicate = duplicateCandidate?.find((signal) => {
    const text = `${signal.title} ${signal.description}`.toLowerCase();
    const sample = `${payload.title} ${payload.description}`.toLowerCase();
    return text.includes(sample.slice(0, Math.min(30, sample.length)));
  });

  const { data: inserted, error } = await supabase
    .from("signals")
    .insert({
      title: payload.title,
      description: payload.description,
      district: payload.district ?? "Unknown",
      submitter_name: payload.submitterName ?? "Anonymous",
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

  const timelineSeed: SignalTimelineSeed[] = [
    {
      event_type: "original_signal",
      payload: {
        actor: "citizen",
        message: payload.description,
      },
    },
    {
      event_type: "ai_summary",
      payload: {
        actor: "ai",
        message: aiSummary,
      },
    },
    {
      event_type: "submitted_to_municipality",
      payload: {
        actor: "system",
        message: `Signal submitted to municipality for district: ${payload.district ?? "Unknown"}.`,
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
      signal: inserted,
      attachments: uploadedFiles,
      duplicate_of_signal_id: duplicate?.id ?? null,
    },
    202
  );
});
