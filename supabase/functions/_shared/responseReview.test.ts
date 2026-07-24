import { describe, expect, it } from "vitest";
import {
  buildFallbackPlatformReply,
  buildResponseReviewUserPrompt,
  finalizeResponseReview,
  parseResponseReviewContent,
} from "./responseReview";

describe("buildResponseReviewUserPrompt", () => {
  it("includes signal and municipality text", () => {
    const prompt = buildResponseReviewUserPrompt({
      signalTitle: "Broken lights",
      signalDescription: "Street lights are out near the monument.",
      municipalityResponse: "We will inspect next week.",
    });

    expect(prompt).toContain("Заглавие на сигнала:");
    expect(prompt).toContain("Broken lights");
    expect(prompt).toContain("Street lights are out");
    expect(prompt).toContain("inspect next week");
  });

  it("includes public site url when provided", () => {
    const prompt = buildResponseReviewUserPrompt(
      {
        signalTitle: "T",
        signalDescription: "D",
        municipalityResponse: "R",
      },
      "https://example.com"
    );
    expect(prompt).toContain("https://example.com");
  });
});

describe("parseResponseReviewContent", () => {
  it("parses satisfactory review with platform reply", () => {
    const result = parseResponseReviewContent(
      JSON.stringify({
        satisfactory: true,
        reason: "Отговорът включва конкретен срок за оглед.",
        suggested_follow_up: "няма",
        platform_reply: "Здравейте,\n\nБлагодарим.\n\nПоздрави,\nTransparent Ruse",
      })
    );

    expect(result.satisfactory).toBe(true);
    expect(result.reason).toContain("срок");
    expect(result.platform_reply).toContain("Здравейте");
  });

  it("parses unsatisfactory review", () => {
    const result = parseResponseReviewContent(
      JSON.stringify({
        satisfactory: false,
        reason: "Само общо потвърждение.",
        suggested_follow_up: "Поискайте срок.",
        platform_reply: "Здравейте,\n\nМоля, уточнете срок.\n\nПоздрави,\nTransparent Ruse",
      })
    );

    expect(result.satisfactory).toBe(false);
    expect(result.suggested_follow_up).toContain("срок");
    expect(result.platform_reply).toContain("уточнете");
  });

  it("falls back safely on invalid JSON", () => {
    const result = parseResponseReviewContent("not-json");

    expect(result.satisfactory).toBe(false);
    expect(result.reason).toMatch(/не може да се прочете/i);
    expect(result.suggested_follow_up.length).toBeGreaterThan(10);
  });
});

describe("finalizeResponseReview", () => {
  const payload = {
    signalTitle: "Счупено осветление",
    signalDescription: "Лампите не работят.",
    municipalityResponse: "Получихме сигнала.",
  };

  it("builds fallback platform reply when AI omits it", () => {
    const finalized = finalizeResponseReview(
      {
        satisfactory: false,
        reason: "Неясен отговор.",
        suggested_follow_up: "Поискайте срок.",
        platform_reply: "",
      },
      payload,
      "https://example.com"
    );

    expect(finalized.platform_reply).toContain("Здравейте");
    expect(finalized.platform_reply).toContain("Transparent Ruse");
    expect(finalized.platform_reply).toContain("https://example.com");
  });

  it("clears suggested follow-up for satisfactory reviews", () => {
    const finalized = finalizeResponseReview(
      {
        satisfactory: true,
        reason: "Добър отговор.",
        suggested_follow_up: "няма",
        platform_reply: "Здравейте,\n\nБлагодарим.\n\nПоздрави,\nTransparent Ruse",
      },
      payload
    );

    expect(finalized.suggested_follow_up).toBe("");
  });
});

describe("buildFallbackPlatformReply", () => {
  it("thanks municipality for satisfactory replies", () => {
    const reply = buildFallbackPlatformReply(
      {
        signalTitle: "T",
        signalDescription: "D",
        municipalityResponse: "R",
      },
      { satisfactory: true, suggested_follow_up: "" }
    );

    expect(reply).toContain("Благодарим");
    expect(reply).toContain("Поздрави,");
  });
});
