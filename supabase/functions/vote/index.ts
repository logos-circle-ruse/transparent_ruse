import { createClient } from "npm:@supabase/supabase-js@2";

type VoteType = "up" | "down";

interface VotePayload {
  signalId: string;
  voteType: VoteType;
  voterFingerprint: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function derivePriority(score: number): "Critical" | "High" | "Normal" {
  if (score >= 30) return "Critical";
  if (score >= 12) return "High";
  return "Normal";
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
    return response({ error: "Missing Supabase server credentials." }, 500);
  }

  const payload = (await request.json()) as VotePayload;
  if (!payload.signalId || !payload.voteType || !payload.voterFingerprint) {
    return response({ error: "Missing vote payload fields." }, 400);
  }

  if (payload.voteType !== "up" && payload.voteType !== "down") {
    return response({ error: "Invalid vote type." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const upsertVote = await supabase.from("signal_votes").upsert(
    {
      signal_id: payload.signalId,
      voter_fingerprint: payload.voterFingerprint,
      vote_type: payload.voteType,
    },
    { onConflict: "signal_id,voter_fingerprint" }
  );
  if (upsertVote.error) {
    return response({ error: upsertVote.error.message }, 500);
  }

  const votesResult = await supabase
    .from("signal_votes")
    .select("vote_type")
    .eq("signal_id", payload.signalId);

  if (votesResult.error) {
    return response({ error: votesResult.error.message }, 500);
  }

  const rows = votesResult.data ?? [];
  const upvotes = rows.filter((item) => item.vote_type === "up").length;
  const downvotes = rows.filter((item) => item.vote_type === "down").length;
  const score = upvotes - downvotes;
  const priority = derivePriority(score);

  const updateSignal = await supabase
    .from("signals")
    .update({ upvotes, downvotes, priority })
    .eq("id", payload.signalId)
    .select("id,upvotes,downvotes,priority")
    .single();

  if (updateSignal.error) {
    return response({ error: updateSignal.error.message }, 500);
  }

  return response({
    message: "Vote stored",
    signal: updateSignal.data,
  });
});
