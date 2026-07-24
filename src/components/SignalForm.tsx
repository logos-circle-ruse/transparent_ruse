import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import type { AppTranslations, Locale } from "../i18n";
import { ruseNeighborhoods } from "../data/ruseNeighborhoods";
import { fetchNeighborhoodCatalog } from "../lib/neighborhoodsData";

interface SignalFormProps {
  text: AppTranslations;
  locale: Locale;
  onSubmitted: () => Promise<void>;
}

interface ModerationPreview {
  decision: "approved" | "rejected";
  reason: string;
  formatted_title: string;
  formatted_description: string;
  allow_original: boolean;
  summary: string;
}

const intakeUrl = import.meta.env.VITE_SUPABASE_INTAKE_URL;
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const TITLE_MIN_LENGTH = 5;
const DESCRIPTION_MIN_LENGTH = 20;

function remainingCharsHint(locale: Locale, currentLength: number, minLength: number) {
  const remaining = minLength - currentLength;
  if (remaining <= 0) {
    return locale === "bg" ? "✓ Достатъчна дължина" : "✓ Long enough";
  }
  return locale === "bg"
    ? `Още ${remaining} символа до минимум ${minLength}`
    : `${remaining} more character${remaining === 1 ? "" : "s"} needed (min. ${minLength})`;
}

function buildFormData(input: {
  title: string;
  description: string;
  district: string;
  submitterName: string;
  turnstileToken: string;
  attachments: File[];
  mode: "preview" | "submit";
  previewId?: string;
  descriptionChoice?: "formatted" | "original";
}) {
  const formData = new FormData();
  formData.append("mode", input.mode);
  formData.append("title", input.title);
  formData.append("description", input.description);
  formData.append("district", input.district);
  formData.append("submitterName", input.submitterName);
  formData.append("turnstileToken", input.turnstileToken);
  if (input.previewId) {
    formData.append("previewId", input.previewId);
  }
  if (input.descriptionChoice) {
    formData.append("descriptionChoice", input.descriptionChoice);
  }
  input.attachments.forEach((file) => {
    formData.append("attachments", file);
  });
  return formData;
}

export function SignalForm({ text, locale, onSubmitted }: SignalFormProps) {
  const [neighborhoodRecords, setNeighborhoodRecords] = useState(ruseNeighborhoods);

  useEffect(() => {
    void fetchNeighborhoodCatalog()
      .then((records) => {
        if (records.length === 0) return;
        setNeighborhoodRecords(
          records.map((record) => ({
            id: record.id,
            nameBg: record.nameBg,
            nameEn: record.nameEn,
          }))
        );
      })
      .catch(() => undefined);
  }, []);

  const neighborhoodOptions = useMemo(
    () =>
      neighborhoodRecords.map((neighborhood) => ({
        id: neighborhood.id,
        label: locale === "bg" ? neighborhood.nameBg : neighborhood.nameEn,
      })),
    [locale, neighborhoodRecords]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"draft" | "review">("draft");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [moderationPreview, setModerationPreview] = useState<ModerationPreview | null>(null);
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | number | null>(null);

  const titleLength = title.trim().length;
  const descriptionLength = description.trim().length;
  const isTitleValid = titleLength >= TITLE_MIN_LENGTH;
  const isDescriptionValid = descriptionLength >= DESCRIPTION_MIN_LENGTH;
  const canReview = isTitleValid && isDescriptionValid;
  const previewImages = useMemo(
    () =>
      attachments
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, 4)
        .map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
        })),
    [attachments]
  );

  useEffect(() => {
    return () => {
      previewImages.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [previewImages]);

  const resetReview = () => {
    setStep("draft");
    setPreviewId(null);
    setModerationPreview(null);
    setTurnstileToken("");
    if (window.turnstile && turnstileWidgetId.current !== null) {
      window.turnstile.reset(turnstileWidgetId.current);
    }
    turnstileWidgetId.current = null;
  };

  const mergeFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) {
      return;
    }
    setAttachments((prev) => {
      const current = new Map(prev.map((file) => [`${file.name}-${file.size}`, file]));
      for (const file of Array.from(incoming)) {
        current.set(`${file.name}-${file.size}`, file);
      }
      return Array.from(current.values()).slice(0, 8);
    });
  };

  useEffect(() => {
    if (step !== "review" || !turnstileSiteKey || !turnstileRef.current) {
      return;
    }

    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current) {
        return;
      }

      if (turnstileWidgetId.current !== null) {
        return;
      }

      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
        },
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const existingScript = document.getElementById("turnstile-script");
    if (existingScript) {
      existingScript.addEventListener("load", renderWidget);
      return () => existingScript.removeEventListener("load", renderWidget);
    }

    const script = document.createElement("script");
    script.id = "turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderWidget);
    document.head.appendChild(script);

    return () => script.removeEventListener("load", renderWidget);
  }, [step]);

  const handleFieldChange = () => {
    if (step === "review") {
      resetReview();
      setError(null);
    }
  };

  const handleAiReview = async () => {
    setFeedback(null);
    setError(null);

    if (!intakeUrl) {
      setError("VITE_SUPABASE_INTAKE_URL is not configured.");
      return;
    }

    setIsReviewing(true);

    const res = await fetch(intakeUrl, {
      method: "POST",
      body: buildFormData({
        title: title.trim(),
        description: description.trim(),
        district,
        submitterName,
        turnstileToken: "",
        attachments: [],
        mode: "preview",
      }),
    });

    const data = (await res.json()) as {
      error?: string;
      moderation_reason?: string;
      preview_id?: string;
      moderation?: ModerationPreview;
    };

    if (!res.ok) {
      const baseError = data.error ?? "Unknown backend error.";
      setError(data.moderation_reason ? `${baseError} — ${data.moderation_reason}` : baseError);
      setIsReviewing(false);
      return;
    }

    if (!data.preview_id || !data.moderation) {
      setError("AI preview response was incomplete.");
      setIsReviewing(false);
      return;
    }

    setPreviewId(data.preview_id);
    setModerationPreview(data.moderation);
    setStep("review");
    setIsReviewing(false);
  };

  const handleFinalSubmit = async (descriptionChoice: "formatted" | "original") => {
    setFeedback(null);
    setError(null);

    if (!intakeUrl) {
      setError("VITE_SUPABASE_INTAKE_URL is not configured.");
      return;
    }

    if (!previewId || !moderationPreview) {
      setError(text.formAiPreviewExpired);
      resetReview();
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setError(text.turnstileRequired);
      return;
    }

    setIsSubmitting(true);

    const res = await fetch(intakeUrl, {
      method: "POST",
      body: buildFormData({
        title: title.trim(),
        description: description.trim(),
        district,
        submitterName,
        turnstileToken,
        attachments,
        mode: "submit",
        previewId,
        descriptionChoice,
      }),
    });

    const data = (await res.json()) as { error?: string; moderation_reason?: string };

    if (!res.ok) {
      const baseError = data.error ?? "Unknown backend error.";
      const combined = data.moderation_reason ? `${baseError} — ${data.moderation_reason}` : baseError;
      setError(combined);
      if (res.status === 409 || res.status === 410) {
        resetReview();
      }
      setIsSubmitting(false);
      return;
    }

    setTitle("");
    setDescription("");
    setDistrict("");
    setSubmitterName("");
    setAttachments([]);
    setTurnstileToken("");
    resetReview();
    if (window.turnstile && turnstileWidgetId.current !== null) {
      window.turnstile.reset(turnstileWidgetId.current);
    }
    setFeedback(text.formSuccess);
    await onSubmitted();
    setIsSubmitting(false);
  };

  const handleDraftSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleAiReview();
  };

  const removeAttachment = (target: File) => {
    setAttachments((prev) =>
      prev.filter((file) => !(file.name === target.name && file.size === target.size))
    );
    handleFieldChange();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    mergeFiles(event.dataTransfer.files);
    handleFieldChange();
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <section className="card">
      <header className="section-header">
        <h2>{text.formTitle}</h2>
        <p>{text.formDescription}</p>
      </header>

      <form className="signal-form" onSubmit={handleDraftSubmit}>
        <div className="field-with-hint">
          <label>
            {text.fieldTitle}
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                handleFieldChange();
              }}
              minLength={TITLE_MIN_LENGTH}
              required
              aria-describedby="field-title-hint"
              disabled={isSubmitting}
            />
          </label>
          <p
            id="field-title-hint"
            className={isTitleValid ? "field-length-hint ok" : "field-length-hint"}
          >
            {remainingCharsHint(locale, titleLength, TITLE_MIN_LENGTH)}
          </p>
        </div>

        <div className="field-with-hint">
          <label>
            {text.fieldDescription}
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                handleFieldChange();
              }}
              minLength={DESCRIPTION_MIN_LENGTH}
              rows={5}
              required
              aria-describedby="field-description-hint"
              disabled={isSubmitting}
            />
          </label>
          <p
            id="field-description-hint"
            className={isDescriptionValid ? "field-length-hint ok" : "field-length-hint"}
          >
            {remainingCharsHint(locale, descriptionLength, DESCRIPTION_MIN_LENGTH)}
          </p>
        </div>

        <label>
          {text.fieldDistrict}
          <select
            value={district}
            onChange={(event) => {
              setDistrict(event.target.value);
              handleFieldChange();
            }}
            disabled={isSubmitting}
          >
            <option value="">
              {locale === "bg" ? "Избери квартал" : "Select neighborhood"}
            </option>
            {neighborhoodOptions.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.label}>
                {neighborhood.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {text.fieldName}{" "}
          <span className="field-optional-hint">
            ({locale === "bg" ? "незадължително" : "optional"})
          </span>
          <input
            value={submitterName}
            onChange={(event) => setSubmitterName(event.target.value)}
            maxLength={80}
            placeholder={locale === "bg" ? "Как да те наричаме" : "How should we address you"}
            disabled={isSubmitting}
          />
        </label>

        <fieldset className="attachment-fieldset">
          <legend>{text.fieldAttachments}</legend>
          <div className="attachment-actions">
            <label className="file-action">
              {text.cameraCapture}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  mergeFiles(event.target.files);
                  handleFieldChange();
                }}
              />
            </label>

            <label className="file-action">
              {text.chooseFiles}
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(event) => {
                  mergeFiles(event.target.files);
                  handleFieldChange();
                }}
              />
            </label>
          </div>
          <div
            className={isDragActive ? "drop-zone active" : "drop-zone"}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
          >
            {text.dropFilesHint}
          </div>

          {attachments.length > 0 ? (
            <div className="attachment-list">
              <p>
                {text.attachmentsSelected}: {attachments.length}
              </p>
              <ul>
                {attachments.map((file) => (
                  <li key={`${file.name}-${file.size}`}>
                    <span>{file.name}</span>
                    <div>
                      <small>{formatFileSize(file.size)}</small>
                      <button
                        type="button"
                        className="inline-link"
                        onClick={() => removeAttachment(file)}
                      >
                        {text.removeFile}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {previewImages.length > 0 ? (
            <div className="attachment-previews">
              {previewImages.map((image) => (
                <img key={image.url} src={image.url} alt={image.name} />
              ))}
            </div>
          ) : null}
        </fieldset>

        {step === "draft" ? (
          <>
            <button
              type="submit"
              disabled={!canReview || isReviewing || isSubmitting}
              title={
                !canReview
                  ? locale === "bg"
                    ? "Попълни заглавие (мин. 5 симв.) и описание (мин. 20 симв.), за да подадеш за проверка."
                    : "Fill in the title (min. 5 chars) and description (min. 20 chars) to submit for review."
                  : undefined
              }
            >
              {isReviewing ? text.formAiReviewing : text.formAiReview}
            </button>
            {!canReview ? (
              <p className="field-length-hint submit-blocked-hint">
                {locale === "bg"
                  ? "Попълни заглавие (мин. 5 симв.) и описание (мин. 20 симв.), за да активираш „Подай за проверка“."
                  : "Fill in the title (min. 5 chars) and description (min. 20 chars) to enable “Submit for review”."}
              </p>
            ) : null}
          </>
        ) : null}
      </form>

        {feedback ? <p className="banner-info">{feedback}</p> : null}
        {error ? (
          <p className="banner-warning">
            {text.formErrorPrefix}: {error}
          </p>
        ) : null}
      </section>

      {step === "review" && moderationPreview ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            if (!isSubmitting) resetReview();
          }}
        >
          <section
            className="modal-sheet ai-review-modal"
            role="dialog"
            aria-modal="true"
            aria-label={text.formAiReviewTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-head">
              <div>
                <h2>{text.formAiReviewTitle}</h2>
                <p className="ai-review-modal-lead">{text.formAiReviewDescription}</p>
              </div>
              <button type="button" disabled={isSubmitting} onClick={resetReview}>
                {text.closeDetails}
              </button>
            </header>

            <p className="ai-review-reason">
              <strong>{text.formAiReviewReason}:</strong> {moderationPreview.reason}
            </p>

            {!moderationPreview.allow_original ? (
              <p className="banner-warning">{text.formAiMustUseFormatted}</p>
            ) : null}

            <div className="ai-review-columns">
              <article className="ai-review-card">
                <h3>{text.formAiFormattedLabel}</h3>
                <p className="ai-review-field-label">{text.formAiFormattedTitleLabel}</p>
                <p className="ai-review-title">{moderationPreview.formatted_title}</p>
                <p className="ai-review-field-label">{text.fieldDescription}</p>
                <pre className="ai-review-text">{moderationPreview.formatted_description}</pre>
              </article>

              <article className="ai-review-card muted">
                <h3>{text.formAiOriginalLabel}</h3>
                <p className="ai-review-field-label">{text.fieldTitle}</p>
                <p className="ai-review-title">{title}</p>
                <p className="ai-review-field-label">{text.fieldDescription}</p>
                <pre className="ai-review-text">{description}</pre>
              </article>
            </div>

            {turnstileSiteKey ? (
              <fieldset className="attachment-fieldset">
                <legend>{text.turnstileHint}</legend>
                <div ref={turnstileRef} />
              </fieldset>
            ) : null}

            <div className="ai-review-actions">
              <button
                type="button"
                className="admin-primary-btn"
                disabled={isSubmitting}
                onClick={() => void handleFinalSubmit("formatted")}
              >
                {isSubmitting ? text.formSubmitting : text.formAiUseFormatted}
              </button>
              {moderationPreview.allow_original ? (
                <button
                  type="button"
                  className="vote-btn secondary"
                  disabled={isSubmitting}
                  onClick={() => void handleFinalSubmit("original")}
                >
                  {text.formAiUseOriginal}
                </button>
              ) : null}
              <button
                type="button"
                className="vote-btn secondary"
                disabled={isSubmitting}
                onClick={resetReview}
              >
                {text.formAiEditAgain}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
