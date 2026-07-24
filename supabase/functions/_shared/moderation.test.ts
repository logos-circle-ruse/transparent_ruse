import { describe, expect, it } from "vitest";
import {
  buildLetterClosing,
  buildModerationUserPrompt,
  finalizeFormattedDescription,
  findDuplicateSignal,
  parseModerationContent,
  resolveCitizenSignoff,
  resolveSubmittedDescription,
} from "./moderation";

describe("letter closing helpers", () => {
  it("uses Анонимен гражданин for anonymous submitters", () => {
    expect(resolveCitizenSignoff()).toBe("Анонимен гражданин");
    expect(resolveCitizenSignoff("Анонимен")).toBe("Анонимен гражданин");
    expect(resolveCitizenSignoff("anonymous")).toBe("Анонимен гражданин");
  });

  it("keeps a real submitter name in the closing block", () => {
    expect(resolveCitizenSignoff("Иван Петров")).toBe("Иван Петров");
  });

  it("builds the multi-line closing block with optional site link", () => {
    expect(buildLetterClosing()).toBe("Поздрави,\nАнонимен гражданин\n\nTransparent Ruse");
    expect(buildLetterClosing("Иван Петров", "https://example.com")).toBe(
      "Поздрави,\nИван Петров\n\nTransparent Ruse\nhttps://example.com"
    );
  });

  it("finalizes formatted descriptions with the standard closing block", () => {
    const finalized = finalizeFormattedDescription(
      "Здравейте,\n\nПроблем с осветлението.",
      { title: "T", description: "D" },
      "https://example.com"
    );

    expect(finalized).toContain("Поздрави,");
    expect(finalized).toContain("Анонимен гражданин");
    expect(finalized).toContain("Transparent Ruse");
    expect(finalized).toContain("https://example.com");
  });
});

describe("parseModerationContent", () => {
  it("normalizes a well-formed approved response with formatting fields", () => {
    const result = parseModerationContent(
      JSON.stringify({
        decision: "approved",
        reason: "Сигналът описва реален проблем.",
        duplicate_hint: "none",
        formatted_title: "Счупено осветление",
        formatted_description: "Здравейте,\n\n...\n\nПоздрави,",
        allow_original: true,
        summary: "Счупено осветление в центъра.",
      }),
      { title: "test", description: "desc" }
    );

    expect(result.decision).toBe("approved");
    expect(result.formatted_title).toBe("Счупено осветление");
    expect(result.allow_original).toBe(true);
    expect(result.summary).toContain("осветление");
    expect(result.formatted_description).toContain("Поздрави,");
    expect(result.formatted_description).toContain("Анонимен гражданин");
    expect(result.formatted_description).toContain("Transparent Ruse");
  });

  it("preserves rejected decisions and Bulgarian reasons", () => {
    const result = parseModerationContent(
      JSON.stringify({
        decision: "rejected",
        reason: "Текстът съдържа само псувни без описан проблем.",
        duplicate_hint: "none",
      }),
      { title: "x", description: "y" }
    );
    expect(result.decision).toBe("rejected");
    expect(result.reason).toContain("псувни");
  });

  it("defaults allow_original to true when omitted", () => {
    const result = parseModerationContent(
      JSON.stringify({ decision: "approved", reason: "ok" }),
      { title: "Title", description: "Description long enough" }
    );
    expect(result.allow_original).toBe(true);
    expect(result.formatted_description).toContain("Здравейте");
  });

  it("falls back safely when JSON is invalid", () => {
    const result = parseModerationContent("not json", {
      title: "Broken light",
      description: "Street light is off for a week in center.",
    });
    expect(result.decision).toBe("approved");
    expect(result.reason).toMatch(/резервна политика/i);
  });
});

describe("resolveSubmittedDescription", () => {
  const moderation = {
    decision: "approved" as const,
    reason: "ok",
    duplicate_hint: "none",
    formatted_title: "Форматирано заглавие",
    formatted_description: "Здравейте,\n\nФорматиран текст.\n\nПоздрави,",
    allow_original: true,
    summary: "Резюме",
  };

  it("returns formatted text when requested", () => {
    const resolved = resolveSubmittedDescription(
      moderation,
      { title: "Raw title", description: "Raw description here" },
      "formatted"
    );
    expect(resolved.source).toBe("formatted");
    expect(resolved.description).toContain("Форматиран текст");
  });

  it("returns original text when allowed", () => {
    const resolved = resolveSubmittedDescription(
      moderation,
      { title: "Raw title", description: "Raw description here" },
      "original"
    );
    expect(resolved.source).toBe("original");
    expect(resolved.description).toBe("Raw description here");
  });

  it("blocks original text when allow_original is false", () => {
    expect(() =>
      resolveSubmittedDescription(
        { ...moderation, allow_original: false },
        { title: "Raw title", description: "Raw description here" },
        "original"
      )
    ).toThrow(/not allowed/i);
  });
});

describe("buildModerationUserPrompt", () => {
  it("includes Bulgarian labels and district fallback", () => {
    const prompt = buildModerationUserPrompt({
      title: "Счупена пътека",
      description: "Пътеката е счупена от седмица.",
      district: "Център",
    });
    expect(prompt).toContain("Заглавие:");
    expect(prompt).toContain("Счупена пътека");
    expect(prompt).toContain("Център");
  });

  it("falls back to Неуточнен when district is missing", () => {
    const prompt = buildModerationUserPrompt({ title: "T", description: "D" });
    expect(prompt).toContain("Неуточнен");
  });

  it("includes public site url hint when provided", () => {
    const prompt = buildModerationUserPrompt({
      title: "T",
      description: "D",
      publicSiteUrl: "https://example.com",
    });
    expect(prompt).toContain("https://example.com");
  });
});

describe("findDuplicateSignal", () => {
  const candidates = [
    {
      id: "1",
      title: "Broken streetlight",
      description: "The streetlight on Borisova street has been off for a week now.",
    },
    {
      id: "2",
      title: "Illegal dumping",
      description: "Someone dumped construction waste near the river bank.",
    },
  ];

  it("finds a candidate whose text contains the new submission's prefix", () => {
    const match = findDuplicateSignal(candidates, {
      title: "Broken streetlight",
      description: "The streetlight on Borisova street has been off for a week now, please fix.",
    });
    expect(match?.id).toBe("1");
  });

  it("returns undefined when there is no meaningful overlap", () => {
    const match = findDuplicateSignal(candidates, {
      title: "Pothole",
      description: "There is a large pothole on Tsar Osvoboditel boulevard.",
    });
    expect(match).toBeUndefined();
  });
});
