import { hasSupabaseEnv, supabase } from "./supabaseClient";

const voteUrl = import.meta.env.VITE_SUPABASE_VOTE_URL;

type VoteType = "up" | "down";

function getVoterFingerprint() {
  const key = "transparent-ruse-voter-id";
  const current = localStorage.getItem(key);
  if (current) {
    return current;
  }

  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}

export async function voteSignal(signalId: string, voteType: VoteType) {
  const voterFingerprint = getVoterFingerprint();

  if (voteUrl) {
    const response = await fetch(voteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalId, voteType, voterFingerprint }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "Vote request failed.");
    }
    return;
  }

  if (!hasSupabaseEnv || !supabase) {
    throw new Error("Voting endpoint is not configured.");
  }
}
