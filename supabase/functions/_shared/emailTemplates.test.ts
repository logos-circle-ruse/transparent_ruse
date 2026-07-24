import { describe, expect, it } from "vitest";
import { renderEmailTemplate, SAMPLE_EMAIL_VARIABLES } from "./emailTemplates";

describe("renderEmailTemplate", () => {
  it("replaces known placeholders", () => {
    const rendered = renderEmailTemplate(
      "Signal {{signal_title}} in {{district}}",
      SAMPLE_EMAIL_VARIABLES
    );

    expect(rendered).toContain("Счупено осветление");
    expect(rendered).toContain("Център");
  });

  it("leaves unknown placeholders empty", () => {
    const rendered = renderEmailTemplate("Hello {{unknown_key}}", {});
    expect(rendered).toBe("Hello ");
  });
});
