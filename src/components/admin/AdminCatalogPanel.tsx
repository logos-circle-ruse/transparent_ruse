import { useEffect, useState } from "react";
import type { AppTranslations } from "../../i18n";
import {
  deleteAdminAiPrompt,
  deleteAdminEmailTemplate,
  deleteAdminNeighborhood,
  listAdminAiPrompts,
  listAdminEmailTemplates,
  listAdminNeighborhoods,
  previewAdminEmailTemplate,
  seedAdminNeighborhoods,
  sendAdminTestEmail,
  upsertAdminAiPrompt,
  upsertAdminEmailTemplate,
  upsertAdminNeighborhood,
  type AiPromptRow,
  type EmailTemplateRow,
  type NeighborhoodRow,
} from "../../lib/adminApi";

interface AdminCatalogPanelProps {
  text: AppTranslations;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function AdminCatalogPanel({ text, onNotice, onError }: AdminCatalogPanelProps) {
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodRow[]>([]);
  const [prompts, setPrompts] = useState<AiPromptRow[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateRow[]>([]);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | null>(null);
  const [selectedPromptKey, setSelectedPromptKey] = useState<string | null>(null);
  const [selectedEmailTemplateKey, setSelectedEmailTemplateKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ subject: string; body: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");

  const [neighborhoodDraft, setNeighborhoodDraft] = useState({
    id: "",
    name_bg: "",
    name_en: "",
    aliases: "",
    sort_order: 0,
    active: true,
  });

  const [promptDraft, setPromptDraft] = useState({
    key: "",
    kind: "custom" as AiPromptRow["kind"],
    title: "",
    description: "",
    system_prompt: "",
  });

  const [emailTemplateDraft, setEmailTemplateDraft] = useState({
    key: "",
    name: "",
    recipient_email: "",
    subject_template: "",
    body_template: "",
    description: "",
    active: true,
  });

  const loadCatalog = async () => {
    const [nextNeighborhoods, nextPrompts, nextEmailTemplates] = await Promise.all([
      listAdminNeighborhoods(),
      listAdminAiPrompts(),
      listAdminEmailTemplates(),
    ]);
    setNeighborhoods(nextNeighborhoods);
    setPrompts(nextPrompts);
    setEmailTemplates(nextEmailTemplates);
  };

  useEffect(() => {
    void loadCatalog().catch((error: unknown) => {
      onError(error instanceof Error ? error.message : text.adminError);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedNeighborhood = neighborhoods.find((item) => item.id === selectedNeighborhoodId) ?? null;
  const selectedPrompt = prompts.find((item) => item.key === selectedPromptKey) ?? null;
  const selectedEmailTemplate =
    emailTemplates.find((item) => item.key === selectedEmailTemplateKey) ?? null;

  useEffect(() => {
    if (!selectedNeighborhood) return;
    setNeighborhoodDraft({
      id: selectedNeighborhood.id,
      name_bg: selectedNeighborhood.name_bg,
      name_en: selectedNeighborhood.name_en,
      aliases: (selectedNeighborhood.aliases ?? []).join(", "),
      sort_order: selectedNeighborhood.sort_order,
      active: selectedNeighborhood.active,
    });
  }, [selectedNeighborhood]);

  useEffect(() => {
    if (!selectedPrompt) return;
    setPromptDraft({
      key: selectedPrompt.key,
      kind: selectedPrompt.kind,
      title: selectedPrompt.title,
      description: selectedPrompt.description ?? "",
      system_prompt: selectedPrompt.system_prompt,
    });
  }, [selectedPrompt]);

  useEffect(() => {
    if (!selectedEmailTemplate) return;
    setEmailTemplateDraft({
      key: selectedEmailTemplate.key,
      name: selectedEmailTemplate.name,
      recipient_email: selectedEmailTemplate.recipient_email ?? "",
      subject_template: selectedEmailTemplate.subject_template,
      body_template: selectedEmailTemplate.body_template,
      description: selectedEmailTemplate.description ?? "",
      active: selectedEmailTemplate.active,
    });
    setEmailPreview(null);
  }, [selectedEmailTemplate]);

  const handleSeedNeighborhoods = async () => {
    setIsSaving(true);
    try {
      await seedAdminNeighborhoods();
      await loadCatalog();
      onNotice(text.adminCatalogSeeded);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNeighborhood = async () => {
    setIsSaving(true);
    try {
      const saved = await upsertAdminNeighborhood({
        id: neighborhoodDraft.id.trim(),
        name_bg: neighborhoodDraft.name_bg.trim(),
        name_en: neighborhoodDraft.name_en.trim(),
        aliases: neighborhoodDraft.aliases
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        sort_order: neighborhoodDraft.sort_order,
        active: neighborhoodDraft.active,
      });
      setSelectedNeighborhoodId(saved.id);
      await loadCatalog();
      onNotice(text.adminSaved);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNeighborhood = async () => {
    if (!selectedNeighborhoodId) return;
    setIsSaving(true);
    try {
      await deleteAdminNeighborhood(selectedNeighborhoodId);
      setSelectedNeighborhoodId(null);
      await loadCatalog();
      onNotice(text.adminSaved);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrompt = async () => {
    setIsSaving(true);
    try {
      const saved = await upsertAdminAiPrompt({
        key: promptDraft.key.trim(),
        kind: promptDraft.kind,
        title: promptDraft.title.trim(),
        description: promptDraft.description.trim() || null,
        system_prompt: promptDraft.system_prompt,
      });
      setSelectedPromptKey(saved.key);
      await loadCatalog();
      onNotice(text.adminSaved);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrompt = async () => {
    if (!selectedPromptKey) return;
    setIsSaving(true);
    try {
      await deleteAdminAiPrompt(selectedPromptKey);
      setSelectedPromptKey(null);
      await loadCatalog();
      onNotice(text.adminSaved);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmailTemplate = async () => {
    setIsSaving(true);
    try {
      const saved = await upsertAdminEmailTemplate({
        key: emailTemplateDraft.key.trim(),
        name: emailTemplateDraft.name.trim(),
        recipient_email: emailTemplateDraft.recipient_email.trim() || null,
        subject_template: emailTemplateDraft.subject_template,
        body_template: emailTemplateDraft.body_template,
        description: emailTemplateDraft.description.trim() || null,
        active: emailTemplateDraft.active,
      });
      setSelectedEmailTemplateKey(saved.key);
      await loadCatalog();
      onNotice(text.adminSaved);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmailTemplate = async () => {
    if (!selectedEmailTemplateKey) return;
    setIsSaving(true);
    try {
      await deleteAdminEmailTemplate(selectedEmailTemplateKey);
      setSelectedEmailTemplateKey(null);
      setEmailPreview(null);
      await loadCatalog();
      onNotice(text.adminSaved);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewEmailTemplate = async () => {
    setIsSaving(true);
    try {
      const preview = await previewAdminEmailTemplate({
        template: {
          subject_template: emailTemplateDraft.subject_template,
          body_template: emailTemplateDraft.body_template,
          recipient_email: emailTemplateDraft.recipient_email.trim() || null,
        },
      });
      setEmailPreview({ subject: preview.subject, body: preview.body });
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) return;
    setIsSaving(true);
    try {
      await sendAdminTestEmail({
        testEmail: testEmail.trim(),
        template: {
          subject_template: emailTemplateDraft.subject_template,
          body_template: emailTemplateDraft.body_template,
        },
      });
      onNotice(text.adminEmailTestSent);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-catalog-grid">
      <section className="card admin-editor admin-neighborhoods-compact">
        <div className="admin-neighborhoods-toolbar">
          <div className="admin-neighborhoods-heading">
            <h3>{text.adminCatalogNeighborhoodsTitle}</h3>
            <span>{text.adminCatalogNeighborhoodsDescription}</span>
          </div>
          <div className="admin-neighborhoods-controls">
            <select
              value={selectedNeighborhoodId ?? ""}
              onChange={(event) => setSelectedNeighborhoodId(event.target.value || null)}
            >
              <option value="">{text.adminCatalogNeighborhoodSelect}</option>
              {neighborhoods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name_bg}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="vote-btn secondary"
              disabled={isSaving}
              onClick={() => void handleSeedNeighborhoods()}
            >
              {text.adminCatalogSeedNeighborhoods}
            </button>
          </div>
        </div>

        <form
          className="signal-form admin-editor-form admin-neighborhoods-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSaveNeighborhood();
          }}
        >
          <div className="admin-field-row">
            <label>
              ID
              <input
                value={neighborhoodDraft.id}
                onChange={(event) => setNeighborhoodDraft((c) => ({ ...c, id: event.target.value }))}
                required
              />
            </label>
            <label>
              {text.adminCatalogNameBg}
              <input
                value={neighborhoodDraft.name_bg}
                onChange={(event) => setNeighborhoodDraft((c) => ({ ...c, name_bg: event.target.value }))}
                required
              />
            </label>
          </div>
          <div className="admin-field-row">
            <label>
              {text.adminCatalogNameEn}
              <input
                value={neighborhoodDraft.name_en}
                onChange={(event) => setNeighborhoodDraft((c) => ({ ...c, name_en: event.target.value }))}
                required
              />
            </label>
            <label>
              {text.adminCatalogAliases}
              <input
                value={neighborhoodDraft.aliases}
                onChange={(event) => setNeighborhoodDraft((c) => ({ ...c, aliases: event.target.value }))}
                placeholder="център, center"
              />
            </label>
          </div>
          <div className="admin-head-actions">
            <button
              type="button"
              className="vote-btn secondary"
              onClick={() => {
                setSelectedNeighborhoodId(null);
                setNeighborhoodDraft({
                  id: "",
                  name_bg: "",
                  name_en: "",
                  aliases: "",
                  sort_order: 0,
                  active: true,
                });
              }}
            >
              {text.adminCatalogNew}
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? text.adminSaving : text.adminSaveChanges}
            </button>
            <button
              type="button"
              className="vote-btn secondary"
              disabled={!selectedNeighborhoodId || isSaving}
              onClick={() => void handleDeleteNeighborhood()}
            >
              {text.adminCatalogDelete}
            </button>
          </div>
        </form>
      </section>

      <section className="card admin-editor">
        <div className="section-header">
          <h3>{text.adminCatalogPromptsTitle}</h3>
          <p>{text.adminCatalogPromptsDescription}</p>
        </div>

        <div className="admin-layout">
          <aside className="admin-signal-list card">
            <ul>
              {prompts.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className={selectedPromptKey === item.key ? "admin-signal-item active" : "admin-signal-item"}
                    onClick={() => setSelectedPromptKey(item.key)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.key}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <form
            className="signal-form admin-editor-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSavePrompt();
            }}
          >
            <label>
              Key
              <input
                value={promptDraft.key}
                onChange={(event) => setPromptDraft((c) => ({ ...c, key: event.target.value }))}
                required
              />
            </label>
            <label>
              {text.adminTestingKind}
              <select
                value={promptDraft.kind}
                onChange={(event) =>
                  setPromptDraft((c) => ({ ...c, kind: event.target.value as AiPromptRow["kind"] }))
                }
              >
                <option value="moderation">moderation</option>
                <option value="response_review">response_review</option>
                <option value="custom">custom</option>
              </select>
            </label>
            <label>
              {text.adminTestingName}
              <input
                value={promptDraft.title}
                onChange={(event) => setPromptDraft((c) => ({ ...c, title: event.target.value }))}
                required
              />
            </label>
            <label>
              {text.adminCatalogPromptDescription}
              <input
                value={promptDraft.description}
                onChange={(event) => setPromptDraft((c) => ({ ...c, description: event.target.value }))}
              />
            </label>
            <label>
              {text.adminTestingSystemPrompt}
              <textarea
                rows={10}
                value={promptDraft.system_prompt}
                onChange={(event) => setPromptDraft((c) => ({ ...c, system_prompt: event.target.value }))}
                required
              />
            </label>
            <div className="admin-head-actions">
              <button type="button" className="vote-btn secondary" onClick={() => setSelectedPromptKey(null)}>
                {text.adminCatalogNew}
              </button>
              <button type="submit" disabled={isSaving}>
                {isSaving ? text.adminSaving : text.adminSaveChanges}
              </button>
              <button type="button" className="vote-btn secondary" disabled={!selectedPromptKey || isSaving} onClick={() => void handleDeletePrompt()}>
                {text.adminCatalogDelete}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card admin-editor">
        <div className="section-header">
          <h3>{text.adminCatalogEmailsTitle}</h3>
          <p>{text.adminCatalogEmailsDescription}</p>
          <p className="admin-template-vars">{text.adminEmailTemplateVariables}</p>
        </div>

        <div className="admin-layout">
          <aside className="admin-signal-list card">
            <ul>
              {emailTemplates.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className={
                      selectedEmailTemplateKey === item.key
                        ? "admin-signal-item active"
                        : "admin-signal-item"
                    }
                    onClick={() => setSelectedEmailTemplateKey(item.key)}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.key}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <form
            className="signal-form admin-editor-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveEmailTemplate();
            }}
          >
            <label>
              Key
              <input
                value={emailTemplateDraft.key}
                onChange={(event) =>
                  setEmailTemplateDraft((current) => ({ ...current, key: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {text.adminTestingName}
              <input
                value={emailTemplateDraft.name}
                onChange={(event) =>
                  setEmailTemplateDraft((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {text.adminEmailTemplateRecipient}
              <input
                type="email"
                value={emailTemplateDraft.recipient_email}
                onChange={(event) =>
                  setEmailTemplateDraft((current) => ({
                    ...current,
                    recipient_email: event.target.value,
                  }))
                }
                placeholder="signals@ruse.bg"
              />
            </label>
            <label>
              {text.adminEmailTemplateSubject}
              <input
                value={emailTemplateDraft.subject_template}
                onChange={(event) =>
                  setEmailTemplateDraft((current) => ({
                    ...current,
                    subject_template: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              {text.adminEmailTemplateBody}
              <textarea
                rows={12}
                value={emailTemplateDraft.body_template}
                onChange={(event) =>
                  setEmailTemplateDraft((current) => ({
                    ...current,
                    body_template: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              {text.adminCatalogPromptDescription}
              <input
                value={emailTemplateDraft.description}
                onChange={(event) =>
                  setEmailTemplateDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={emailTemplateDraft.active}
                onChange={(event) =>
                  setEmailTemplateDraft((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
              />
              {text.adminEmailTemplateActive}
            </label>
            <label>
              Test email
              <input
                type="email"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <div className="admin-head-actions">
              <button
                type="button"
                className="vote-btn secondary"
                onClick={() => {
                  setSelectedEmailTemplateKey(null);
                  setEmailPreview(null);
                  setEmailTemplateDraft({
                    key: "",
                    name: "",
                    recipient_email: "",
                    subject_template: "",
                    body_template: "",
                    description: "",
                    active: true,
                  });
                }}
              >
                {text.adminCatalogNew}
              </button>
              <button type="submit" disabled={isSaving}>
                {isSaving ? text.adminSaving : text.adminSaveChanges}
              </button>
              <button
                type="button"
                className="vote-btn secondary"
                disabled={isSaving}
                onClick={() => void handlePreviewEmailTemplate()}
              >
                {text.adminEmailTemplatePreview}
              </button>
              <button
                type="button"
                className="vote-btn secondary"
                disabled={isSaving || !testEmail.trim()}
                onClick={() => void handleSendTestEmail()}
              >
                {text.adminEmailTemplateSendTest}
              </button>
              <button
                type="button"
                className="vote-btn secondary"
                disabled={!selectedEmailTemplateKey || isSaving}
                onClick={() => void handleDeleteEmailTemplate()}
              >
                {text.adminCatalogDelete}
              </button>
            </div>
            {emailPreview ? (
              <div className="admin-review-result ok">
                <p>
                  <strong>{text.adminEmailPreviewSubject}</strong> {emailPreview.subject}
                </p>
                <pre className="admin-json">{emailPreview.body}</pre>
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
