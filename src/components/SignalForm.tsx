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

interface SignalFormProps {
  text: AppTranslations;
  locale: Locale;
  onSubmitted: () => Promise<void>;
}

const intakeUrl = import.meta.env.VITE_SUPABASE_INTAKE_URL;
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function SignalForm({ text, locale, onSubmitted }: SignalFormProps) {
  const neighborhoodOptions = useMemo(
    () =>
      ruseNeighborhoods.map((neighborhood) => ({
        id: neighborhood.id,
        label: locale === "bg" ? neighborhood.nameBg : neighborhood.nameEn,
      })),
    [locale]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | number | null>(null);

  const canSubmit = title.trim().length >= 5 && description.trim().length >= 20;
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
    if (!turnstileSiteKey || !turnstileRef.current) {
      return;
    }

    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current || turnstileWidgetId.current) {
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
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    if (!intakeUrl) {
      setError("VITE_SUPABASE_INTAKE_URL is not configured.");
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setError(text.turnstileRequired);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("district", district);
    formData.append("turnstileToken", turnstileToken);
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    const res = await fetch(intakeUrl, {
      method: "POST",
      body: formData,
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Unknown backend error.");
      setIsSubmitting(false);
      return;
    }

    setTitle("");
    setDescription("");
    setDistrict("");
    setAttachments([]);
    setTurnstileToken("");
    if (window.turnstile && turnstileWidgetId.current !== null) {
      window.turnstile.reset(turnstileWidgetId.current);
    }
    setFeedback(text.formSuccess);
    await onSubmitted();
    setIsSubmitting(false);
  };

  const removeAttachment = (target: File) => {
    setAttachments((prev) =>
      prev.filter((file) => !(file.name === target.name && file.size === target.size))
    );
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    mergeFiles(event.dataTransfer.files);
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="card">
      <header className="section-header">
        <h2>{text.formTitle}</h2>
        <p>{text.formDescription}</p>
      </header>

      <form className="signal-form" onSubmit={handleSubmit}>
        <label>
          {text.fieldTitle}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={5}
            required
          />
        </label>

        <label>
          {text.fieldDescription}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={20}
            rows={5}
            required
          />
        </label>

        <label>
          {text.fieldDistrict}
          <select
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
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

        <fieldset className="attachment-fieldset">
          <legend>{text.fieldAttachments}</legend>
          <div className="attachment-actions">
            <label className="file-action">
              {text.cameraCapture}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => mergeFiles(event.target.files)}
              />
            </label>

            <label className="file-action">
              {text.chooseFiles}
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(event) => mergeFiles(event.target.files)}
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

        {turnstileSiteKey ? (
          <fieldset className="attachment-fieldset">
            <legend>{text.turnstileHint}</legend>
            <div ref={turnstileRef} />
          </fieldset>
        ) : null}

        <button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? text.formSubmitting : text.formSubmit}
        </button>
      </form>

      {feedback ? <p className="banner-info">{feedback}</p> : null}
      {error ? (
        <p className="banner-warning">
          {text.formErrorPrefix}: {error}
        </p>
      ) : null}
    </section>
  );
}
