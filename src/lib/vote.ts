import { hasSupabaseEnv, supabase } from "./supabaseClient";

const voteUrl = import.meta.env.VITE_SUPABASE_VOTE_URL;

type VoteType = "up" | "down";

interface UpdatedSignal {
  id: string;
  upvotes: number;
  downvotes: number;
  priority: string;
}


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

export async function voteSignal(signalId: string, voteType: VoteType): Promise<UpdatedSignal | undefined> {

  const voterFingerprint = getVoterFingerprint();

  if (voteUrl) {
    const res = await fetch(voteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalId, voteType, voterFingerprint }),
    });

    const payload = await res.json() as { error?: string; signal?: UpdatedSignal };

    if (!res.ok) {
      throw new Error(payload.error ?? "Vote request failed.");
    }
   
  return payload.signal;
  }

  if (!hasSupabaseEnv || !supabase) {
    throw new Error("Voting endpoint is not configured.");
  }
}
