import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { translations } from "../i18n";

const { fetchNeighborhoodCatalogMock } = vi.hoisted(() => ({
  fetchNeighborhoodCatalogMock: vi.fn().mockResolvedValue([]),
}));

vi.mock("../lib/neighborhoodsData", () => ({
  fetchNeighborhoodCatalog: fetchNeighborhoodCatalogMock,
}));

const originalEnv = { ...import.meta.env };

const approvedModeration = {
  decision: "approved" as const,
  reason: "Сигналът описва реален граждански проблем.",
  formatted_title: "Счупено осветление",
  formatted_description: "Здравейте,\n\nЛампите не работят.\n\nПоздрави,",
  allow_original: true,
  summary: "Счупено осветление.",
};

describe("SignalForm", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  it("shows the AI moderation reason when preview is rejected", async () => {
    import.meta.env.VITE_SUPABASE_INTAKE_URL = "https://example.test/intake";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Signal rejected by moderation policy",
        moderation_reason: "Текстът съдържа само псувни без описан проблем.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { SignalForm } = await import("./SignalForm");
    const user = userEvent.setup();
    const text = translations.bg;

    render(<SignalForm text={text} locale="bg" onSubmitted={vi.fn().mockResolvedValue(undefined)} />);

    await user.type(screen.getByLabelText(text.fieldTitle), "Test signal title");
    await user.type(
      screen.getByLabelText(text.fieldDescription),
      "This description is definitely long enough to pass validation."
    );

    await user.click(screen.getByRole("button", { name: text.formAiReview }));

    expect(await screen.findByText(/псувни без описан проблем/i)).toBeInTheDocument();
  });

  it("shows formatted preview and submits the chosen version", async () => {
    import.meta.env.VITE_SUPABASE_INTAKE_URL = "https://example.test/intake";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preview_id: "preview-1",
          moderation: approvedModeration,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Signal accepted and stored" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { SignalForm } = await import("./SignalForm");
    const user = userEvent.setup();
    const text = translations.bg;
    const onSubmitted = vi.fn().mockResolvedValue(undefined);

    render(<SignalForm text={text} locale="bg" onSubmitted={onSubmitted} />);

    await user.type(screen.getByLabelText(text.fieldTitle), "Test signal title");
    await user.type(
      screen.getByLabelText(text.fieldDescription),
      "This description is definitely long enough to pass validation."
    );

    await user.click(screen.getByRole("button", { name: text.formAiReview }));

    expect(await screen.findByText(/Счупено осветление/)).toBeInTheDocument();
    expect(screen.getByText(/Лампите не работят/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: text.formAiUseFormatted }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, submitOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
    const submittedFormData = submitOptions.body as FormData;
    expect(submittedFormData.get("mode")).toBe("submit");
    expect(submittedFormData.get("previewId")).toBe("preview-1");
    expect(submittedFormData.get("descriptionChoice")).toBe("formatted");
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it("includes an optional submitter name field that is not required to submit", async () => {
    import.meta.env.VITE_SUPABASE_INTAKE_URL = "https://example.test/intake";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preview_id: "preview-2",
          moderation: approvedModeration,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Signal accepted and stored" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { SignalForm } = await import("./SignalForm");
    const user = userEvent.setup();
    const text = translations.bg;

    render(<SignalForm text={text} locale="bg" onSubmitted={vi.fn().mockResolvedValue(undefined)} />);

    const nameInput = screen.getByLabelText(new RegExp(text.fieldName));
    expect(nameInput).not.toBeRequired();

    await user.type(screen.getByLabelText(text.fieldTitle), "Test signal title");
    await user.type(
      screen.getByLabelText(text.fieldDescription),
      "This description is definitely long enough to pass validation."
    );
    await user.type(nameInput, "Ivan Petrov");
    await user.click(screen.getByRole("button", { name: text.formAiReview }));
    await user.click(await screen.findByRole("button", { name: text.formAiUseFormatted }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, submitOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
    const submittedFormData = submitOptions.body as FormData;
    expect(submittedFormData.get("submitterName")).toBe("Ivan Petrov");
  });

  it("keeps the AI review button disabled until title and description meet the minimum length", async () => {
    import.meta.env.VITE_SUPABASE_INTAKE_URL = "https://example.test/intake";
    const { SignalForm } = await import("./SignalForm");
    const user = userEvent.setup();
    const text = translations.bg;

    render(<SignalForm text={text} locale="bg" onSubmitted={vi.fn().mockResolvedValue(undefined)} />);

    const reviewButton = screen.getByRole("button", { name: text.formAiReview });
    expect(reviewButton).toBeDisabled();

    await user.type(screen.getByLabelText(text.fieldTitle), "Short");
    expect(reviewButton).toBeDisabled();

    await user.type(
      screen.getByLabelText(text.fieldDescription),
      "This description is definitely long enough to pass validation."
    );
    expect(reviewButton).toBeEnabled();
  });

  it("hides the original-text button when allow_original is false", async () => {
    import.meta.env.VITE_SUPABASE_INTAKE_URL = "https://example.test/intake";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        preview_id: "preview-3",
        moderation: { ...approvedModeration, allow_original: false },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { SignalForm } = await import("./SignalForm");
    const user = userEvent.setup();
    const text = translations.bg;

    render(<SignalForm text={text} locale="bg" onSubmitted={vi.fn().mockResolvedValue(undefined)} />);

    await user.type(screen.getByLabelText(text.fieldTitle), "Test signal title");
    await user.type(
      screen.getByLabelText(text.fieldDescription),
      "This description is definitely long enough to pass validation."
    );
    await user.click(screen.getByRole("button", { name: text.formAiReview }));

    expect(await screen.findByText(text.formAiMustUseFormatted)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: text.formAiUseOriginal })).not.toBeInTheDocument();
  });
});
