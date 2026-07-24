import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...import.meta.env };

describe("voteSignal", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  it("posts the vote payload with a stable voter fingerprint and returns the updated signal", async () => {
    import.meta.env.VITE_SUPABASE_VOTE_URL = "https://example.test/vote";
    const updatedSignal = { id: "signal-1", upvotes: 5, downvotes: 1, priority: "High" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Vote stored", signal: updatedSignal }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { voteSignal } = await import("./vote");
    const result = await voteSignal("signal-1", "up");

    expect(result).toEqual(updatedSignal);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/vote");
    const body = JSON.parse(options.body as string);
    expect(body.signalId).toBe("signal-1");
    expect(body.voteType).toBe("up");
    expect(typeof body.voterFingerprint).toBe("string");
    expect(body.voterFingerprint.length).toBeGreaterThan(0);

    // The fingerprint must be persisted so repeated votes from this browser are identifiable.
    expect(localStorage.getItem("transparent-ruse-voter-id")).toBe(body.voterFingerprint);
  });

  it("reuses the same voter fingerprint across multiple calls", async () => {
    import.meta.env.VITE_SUPABASE_VOTE_URL = "https://example.test/vote";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ signal: { id: "signal-1", upvotes: 1, downvotes: 0, priority: "Normal" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { voteSignal } = await import("./vote");
    await voteSignal("signal-1", "up");
    await voteSignal("signal-1", "down");

    const firstBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    const secondBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(firstBody.voterFingerprint).toBe(secondBody.voterFingerprint);
  });

  it("throws instead of silently no-op'ing when the vote endpoint is not configured", async () => {
    delete (import.meta.env as Record<string, unknown>).VITE_SUPABASE_VOTE_URL;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { voteSignal } = await import("./vote");
    await expect(voteSignal("signal-1", "up")).rejects.toThrow("Voting endpoint is not configured.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws with the server-provided error message when the request fails", async () => {
    import.meta.env.VITE_SUPABASE_VOTE_URL = "https://example.test/vote";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Signal not found." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { voteSignal } = await import("./vote");
    await expect(voteSignal("missing-signal", "up")).rejects.toThrow("Signal not found.");
  });
});
