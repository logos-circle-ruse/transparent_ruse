import { useEffect, useMemo, useRef, useState } from "react";
import { ruseNeighborhoods } from "../../data/ruseNeighborhoods";
import { statusLabels, type AppTranslations } from "../../i18n";
import type { Locale } from "../../i18n";
import {
  addAdminTimelineEvent,
  createAdminSignal,
  deleteAdminEvent,
  deleteAdminSignal,
  deleteAdminAttachment,
  fetchAdminSignals,
  listAdminNeighborhoods,
  reviewMunicipalityResponse,
  simulateMunicipalityFlow,
  updateAdminSignal,
  uploadAdminAttachment,
} from "../../lib/adminApi";
import { signOutAdmin } from "../../lib/adminAuth";
import { AdminSettingsPanel, type SettingsSection } from "./AdminSettingsPanel";
import { AdminSignalContext } from "./AdminSignalContext";
import type { AdminSignal, ResponseReviewResult, SignalPriority, SignalStatus } from "../../types";

interface AdminPortalProps {
  text: AppTranslations;
  locale: Locale;
  onBackToPublic: () => void;
  onSignalsChanged: () => void;
}

type AdminTab = "signals" | "workbench" | "settings";
type WorkbenchSection = "municipality" | "prompts";

const STATUSES: SignalStatus[] = ["Pending", "Resolved", "No Response"];
const PRIORITIES: SignalPriority[] = ["Normal", "High", "Critical"];

export function AdminPortal({ text, locale, onBackToPublic, onSignalsChanged }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("signals");
  const [workbenchSection, setWorkbenchSection] = useState<WorkbenchSection>("municipality");
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("catalog");
  const [signals, setSignals] = useState<AdminSignal[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [reviewResult, setReviewResult] = useState<ResponseReviewResult | null>(null);
  const [municipalityResponse, setMunicipalityResponse] = useState("");
  const [customEventMessage, setCustomEventMessage] = useState("");
  const [testCases, setTestCases] = useState<Array<{
    id: string;
    name: string;
    kind: "moderation" | "response_review";
    system_prompt: string;
    user_payload: unknown;
    notes: string | null;
    updated_at: string;
  }>>([]);
  const [testRuns, setTestRuns] = useState<Array<{
    id: string;
    test_case_id: string | null;
    kind: "moderation" | "response_review";
    ok: boolean;
    error: string | null;
    created_at: string;
    parsed_output: unknown | null;
  }>>([]);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [testKind, setTestKind] = useState<"moderation" | "response_review">("response_review");
  const [testName, setTestName] = useState("");
  const [testSystemPrompt, setTestSystemPrompt] = useState("");
  const [testUserPayloadText, setTestUserPayloadText] = useState("");
  const [testResult, setTestResult] = useState<unknown | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [neighborhoodOptions, setNeighborhoodOptions] = useState(ruseNeighborhoods);
  const [isCreatingSignal, setIsCreatingSignal] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSignal = useMemo(
    () => signals.find((signal) => signal.id === selectedSignalId) ?? null,
    [selectedSignalId, signals]
  );

  const selectedTestCase = useMemo(
    () => testCases.find((testCase) => testCase.id === selectedTestCaseId) ?? null,
    [selectedTestCaseId, testCases]
  );

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    district: "",
    neighborhoodId: "",
    submitterName: "",
    status: "Pending" as SignalStatus,
    priority: "Normal" as SignalPriority,
    upvotes: 0,
    downvotes: 0,
    aiModerationStatus: "approved",
    aiModerationReason: "",
  });

  const statusLabel = statusLabels[locale];

  const loadSignals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextSignals = await fetchAdminSignals();
      setSignals(nextSignals);
      if (!selectedSignalId && nextSignals.length > 0) {
        setSelectedSignalId(nextSignals[0].id);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : text.adminError;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSignals();
    void listAdminNeighborhoods()
      .then((rows) => {
        if (rows.length === 0) return;
        setNeighborhoodOptions(
          rows.map((row) => ({
            id: row.id,
            nameBg: row.name_bg,
            nameEn: row.name_en,
          }))
        );
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTestBench = async () => {
    const { listAiTestCases, listAiTestRuns } = await import("../../lib/adminApi");
    const [cases, runs] = await Promise.all([listAiTestCases(), listAiTestRuns()]);

    setTestCases(
      cases.map((item) => ({
        id: item.id,
        name: item.name,
        kind: item.kind,
        system_prompt: item.system_prompt,
        user_payload: item.user_payload,
        notes: item.notes,
        updated_at: item.updated_at,
      }))
    );
    setTestRuns(
      runs.map((run) => ({
        id: run.id,
        test_case_id: run.test_case_id,
        kind: run.kind,
        ok: run.ok,
        error: run.error,
        created_at: run.created_at,
        parsed_output: run.parsed_output ?? null,
      }))
    );
  };

  useEffect(() => {
    if (activeTab !== "workbench" || workbenchSection !== "prompts") return;
    void loadTestBench().catch(() => undefined);
  }, [activeTab, workbenchSection]);

  useEffect(() => {
    if (!selectedSignal) {
      return;
    }

    setDraft({
      title: selectedSignal.title,
      description: selectedSignal.description,
      district: selectedSignal.district,
      neighborhoodId: selectedSignal.neighborhoodId ?? "",
      submitterName: selectedSignal.submitterName,
      status: selectedSignal.status,
      priority: selectedSignal.priority,
      upvotes: selectedSignal.upvotes,
      downvotes: selectedSignal.downvotes,
      aiModerationStatus: selectedSignal.aiModerationStatus,
      aiModerationReason: selectedSignal.aiModerationReason ?? "",
    });
    setMunicipalityResponse("");
    setReviewResult(null);
    setCustomEventMessage("");
  }, [selectedSignal]);

  useEffect(() => {
    if (!selectedTestCase) return;
    setSelectedTestCaseId(selectedTestCase.id);
    setTestKind(selectedTestCase.kind);
    setTestName(selectedTestCase.name);
    setTestSystemPrompt(selectedTestCase.system_prompt);
    setTestUserPayloadText(JSON.stringify(selectedTestCase.user_payload ?? {}, null, 2));
    setTestResult(null);
  }, [selectedTestCase]);

  const ensureDefaultTestCase = () => {
    if (testSystemPrompt.trim()) return;
    if (testKind === "response_review") {
      setTestSystemPrompt(
        "Ти си AI медиатор за Transparent Ruse. Върни JSON на български: satisfactory, reason, suggested_follow_up, platform_reply."
      );
      setTestUserPayloadText(
        JSON.stringify(
          {
            signalTitle: selectedSignal?.title ?? "Примерен сигнал",
            signalDescription: selectedSignal?.description ?? "Примерно описание",
            municipalityResponse: "Получихме сигнала и ще действаме.",
          },
          null,
          2
        )
      );
    } else {
      setTestSystemPrompt(
        "You are the moderation assistant for \"Transparent Ruse\".\n\nReturn strict JSON with keys: decision (approved|rejected), reason, duplicate_hint."
      );
      setTestUserPayloadText(
        JSON.stringify(
          {
            title: selectedSignal?.title ?? "Example title",
            description: selectedSignal?.description ?? "Example description",
            district: selectedSignal?.district ?? "Unknown",
          },
          null,
          2
        )
      );
    }
  };

  const handleRunTest = async () => {
    const { runAiTest } = await import("../../lib/adminApi");
    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const userPayload = JSON.parse(testUserPayloadText || "{}") as unknown;
      const run = await runAiTest({
        testCaseId: selectedTestCaseId ?? undefined,
        kind: testKind,
        systemPrompt: testSystemPrompt,
        userPayload,
      });
      setTestResult(run.parsed_output ?? null);
      await loadTestBench();
      setNotice(text.adminSaved);
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : text.adminError;
      setError(message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveTestCase = async () => {
    const { upsertAiTestCase } = await import("../../lib/adminApi");
    setIsSaving(true);
    setError(null);

    try {
      const userPayload = JSON.parse(testUserPayloadText || "{}") as unknown;
      const saved = await upsertAiTestCase({
        id: selectedTestCaseId ?? undefined,
        name: testName.trim() || "Untitled test",
        kind: testKind,
        system_prompt: testSystemPrompt,
        user_payload: userPayload,
      });
      setSelectedTestCaseId(saved.id);
      await loadTestBench();
      setNotice(text.adminSaved);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : text.adminError;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewTestCase = () => {
    setSelectedTestCaseId(null);
    setTestName("");
    setTestSystemPrompt("");
    setTestUserPayloadText("");
    setTestResult(null);
    ensureDefaultTestCase();
  };

  const handleSaveSignal = async () => {
    if (!selectedSignal) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateAdminSignal(selectedSignal.id, {
        title: draft.title,
        description: draft.description,
        district: draft.district,
        neighborhood_id: draft.neighborhoodId || null,
        submitter_name: draft.submitterName,
        status: draft.status,
        priority: draft.priority,
        upvotes: draft.upvotes,
        downvotes: draft.downvotes,
        ai_moderation_status: draft.aiModerationStatus,
        ai_moderation_reason: draft.aiModerationReason || null,
      });

      setSignals((current) =>
        current.map((signal) => (signal.id === updated.id ? updated : signal))
      );
      setNotice(text.adminSaved);
      onSignalsChanged();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : text.adminError;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSignal = async () => {
    setIsCreatingSignal(true);
    setError(null);
    setNotice(null);

    try {
      const created = await createAdminSignal({
        title: draft.title,
        description: draft.description,
        district: draft.district,
        neighborhood_id: draft.neighborhoodId || null,
        submitter_name: draft.submitterName,
        status: draft.status,
        priority: draft.priority,
      });
      setSignals((current) => [created, ...current]);
      setSelectedSignalId(created.id);
      setNotice(text.adminSignalCreated);
      onSignalsChanged();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : text.adminError;
      setError(message);
    } finally {
      setIsCreatingSignal(false);
    }
  };

  const handleDeleteSignal = async () => {
    if (!selectedSignal) return;
    setIsSaving(true);
    setError(null);

    try {
      await deleteAdminSignal(selectedSignal.id);
      setSignals((current) => current.filter((signal) => signal.id !== selectedSignal.id));
      setSelectedSignalId(null);
      setNotice(text.adminSignalDeleted);
      onSignalsChanged();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : text.adminError;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    if (!selectedSignal) return;

    setIsUploadingAttachment(true);
    setError(null);

    try {
      const uploaded = await uploadAdminAttachment(selectedSignal.id, file);
      setSignals((current) =>
        current.map((signal) =>
          signal.id === selectedSignal.id
            ? { ...signal, attachments: [...signal.attachments, ...uploaded] }
            : signal
        )
      );
      setNotice(text.adminSaved);
      onSignalsChanged();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : text.adminError;
      setError(message);
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedSignal) return;

    setIsSaving(true);
    setError(null);

    try {
      await deleteAdminAttachment(attachmentId);
      setSignals((current) =>
        current.map((signal) =>
          signal.id === selectedSignal.id
            ? {
                ...signal,
                attachments: signal.attachments.filter((attachment) => attachment.id !== attachmentId),
              }
            : signal
        )
      );
      setNotice(text.adminSaved);
      onSignalsChanged();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : text.adminError;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTimelineEvent = async (eventId: string) => {
    if (!selectedSignal) return;
    setIsSaving(true);
    setError(null);

    try {
      await deleteAdminEvent(eventId);
      await loadSignals();
      onSignalsChanged();
      setNotice(text.adminSaved);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : text.adminError;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartNewSignal = () => {
    setSelectedSignalId(null);
    setDraft({
      title: "",
      description: "",
      district: "",
      neighborhoodId: "",
      submitterName: "Anonymous",
      status: "Pending",
      priority: "Normal",
      upvotes: 0,
      downvotes: 0,
      aiModerationStatus: "approved",
      aiModerationReason: "",
    });
    setActiveTab("signals");
  };

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const handleAddCustomEvent = async () => {
    if (!selectedSignal || !customEventMessage.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await addAdminTimelineEvent({
        signalId: selectedSignal.id,
        eventType: "submitted_to_municipality",
        message: customEventMessage.trim(),
        actor: "system",
      });
      setCustomEventMessage("");
      await loadSignals();
      onSignalsChanged();
      setNotice(text.adminSaved);
    } catch (eventError) {
      const message = eventError instanceof Error ? eventError.message : text.adminError;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewResponse = async () => {
    if (!selectedSignal || !municipalityResponse.trim()) return;

    setIsReviewing(true);
    setError(null);
    setReviewResult(null);

    try {
      const review = await reviewMunicipalityResponse({
        signalTitle: selectedSignal.title,
        signalDescription: selectedSignal.description,
        municipalityResponse: municipalityResponse.trim(),
      });
      setReviewResult(review);
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : text.adminError;
      setError(message);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSimulateFlow = async () => {
    if (!selectedSignal || !municipalityResponse.trim()) return;

    setIsSimulating(true);
    setError(null);
    setReviewResult(null);

    try {
      const result = await simulateMunicipalityFlow({
        signalId: selectedSignal.id,
        municipalityResponse: municipalityResponse.trim(),
      });
      setReviewResult(result.review);
      await loadSignals();
      onSignalsChanged();
      setNotice(text.adminFlowSuccess);
    } catch (simulateError) {
      const message = simulateError instanceof Error ? simulateError.message : text.adminError;
      setError(message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    onBackToPublic();
  };

  return (
    <main className="admin-grid">
      <section className="card admin-shell">
        <div className="section-header-row admin-head">
          <div className="section-header">
            <h2>{text.adminTitle}</h2>
            <p>{text.adminSubtitle}</p>
          </div>
          <div className="admin-head-actions">
            <button type="button" className="vote-btn secondary" onClick={onBackToPublic}>
              {text.adminBackToPublic}
            </button>
            <button type="button" className="vote-btn secondary" onClick={() => void handleSignOut()}>
              {text.adminSignOut}
            </button>
          </div>
        </div>

        <nav className="admin-tabs" aria-label="Admin sections">
          <button
            type="button"
            className={activeTab === "signals" ? "admin-tab active" : "admin-tab"}
            onClick={() => setActiveTab("signals")}
          >
            {text.adminTabSignals}
          </button>
          <button
            type="button"
            className={activeTab === "workbench" ? "admin-tab active" : "admin-tab"}
            onClick={() => {
              setActiveTab("workbench");
              if (workbenchSection === "prompts") {
                ensureDefaultTestCase();
              }
            }}
          >
            {text.adminTabWorkbench}
          </button>
          <button
            type="button"
            className={activeTab === "settings" ? "admin-tab active" : "admin-tab"}
            onClick={() => setActiveTab("settings")}
          >
            {text.adminTabSettings}
          </button>
        </nav>

        {isLoading ? <p className="banner-info">{text.adminLoading}</p> : null}
        {error ? <p className="banner-warning">{error}</p> : null}
        {notice ? <p className="banner-info">{notice}</p> : null}

        {activeTab === "settings" ? (
          <AdminSettingsPanel
            text={text}
            locale={locale}
            section={settingsSection}
            onSectionChange={setSettingsSection}
            onNotice={(message) => setNotice(message)}
            onError={(message) => setError(message)}
          />
        ) : null}

        {activeTab !== "settings" ? (
          <>
            {!isLoading && signals.length === 0 ? (
              <div className="admin-head-actions">
                <p className="banner-info">{text.adminNoSignals}</p>
                <button type="button" className="admin-primary-btn" onClick={handleStartNewSignal}>
                  {text.adminSignalCreate}
                </button>
              </div>
            ) : null}

            {!isLoading && (signals.length > 0 || !selectedSignalId || activeTab === "workbench") ? (
          <div className="admin-layout">
            <aside className="admin-signal-list card">
              <div className="section-header-row">
                <h3>{text.adminSelectSignal}</h3>
                <button type="button" className="vote-btn secondary" onClick={handleStartNewSignal}>
                  {text.adminSignalCreate}
                </button>
              </div>
              <ul>
                {signals.map((signal) => (
                  <li key={signal.id}>
                    <button
                      type="button"
                      className={
                        selectedSignalId === signal.id
                          ? "admin-signal-item active"
                          : "admin-signal-item"
                      }
                      onClick={() => setSelectedSignalId(signal.id)}
                    >
                      <strong>{signal.title}</strong>
                      <span>
                        {statusLabel[signal.status]} · {signal.district}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {(selectedSignal || (activeTab === "signals" && !selectedSignalId) || activeTab === "workbench") ? (
              <div className="admin-workspace">
                {activeTab === "workbench" && selectedSignal ? (
                  <AdminSignalContext signal={selectedSignal} text={text} locale={locale} />
                ) : null}

                {activeTab === "workbench" ? (
                  <>
                    {!selectedSignal ? (
                      <p className="banner-info">{text.adminWorkbenchSelectSignal}</p>
                    ) : (
                      <section className="card admin-editor">
                        <nav className="admin-subtabs" aria-label={text.adminWorkbenchNav}>
                          <button
                            type="button"
                            className={
                              workbenchSection === "municipality"
                                ? "admin-subtab active"
                                : "admin-subtab"
                            }
                            onClick={() => setWorkbenchSection("municipality")}
                          >
                            {text.adminWorkbenchMunicipality}
                          </button>
                          <button
                            type="button"
                            className={
                              workbenchSection === "prompts" ? "admin-subtab active" : "admin-subtab"
                            }
                            onClick={() => {
                              setWorkbenchSection("prompts");
                              ensureDefaultTestCase();
                            }}
                          >
                            {text.adminWorkbenchPrompts}
                          </button>
                        </nav>

                        {workbenchSection === "municipality" ? (
                          <div className="admin-workbench-section">
                            <div className="section-header">
                              <h3>{text.adminWorkbenchMunicipalityTitle}</h3>
                              <p>{text.adminMunicipalityFlowDescription}</p>
                            </div>

                            <label className="admin-full-label">
                              {text.adminMunicipalityResponse}
                              <textarea
                                rows={5}
                                value={municipalityResponse}
                                onChange={(event) => setMunicipalityResponse(event.target.value)}
                                placeholder={text.adminMunicipalityResponsePlaceholder}
                              />
                            </label>

                            <div className="admin-head-actions">
                              <button
                                type="button"
                                className="vote-btn secondary"
                                disabled={isReviewing || !municipalityResponse.trim()}
                                onClick={() => void handleReviewResponse()}
                              >
                                {isReviewing ? text.adminReviewing : text.adminRunAiReview}
                              </button>
                              <button
                                type="button"
                                className="admin-primary-btn"
                                disabled={isSimulating || !municipalityResponse.trim()}
                                onClick={() => void handleSimulateFlow()}
                              >
                                {isSimulating ? text.adminSimulating : text.adminSimulateFlow}
                              </button>
                            </div>

                            {reviewResult ? (
                              <div
                                className={
                                  reviewResult.satisfactory
                                    ? "admin-review-result ok"
                                    : "admin-review-result warn"
                                }
                              >
                                <p>
                                  <strong>
                                    {reviewResult.satisfactory
                                      ? text.adminReviewSatisfactory
                                      : text.adminReviewUnsatisfactory}
                                  </strong>
                                </p>
                                <p>{reviewResult.reason}</p>
                                {!reviewResult.satisfactory && reviewResult.suggested_follow_up ? (
                                  <p>
                                    <strong>{text.adminSuggestedFollowUp}</strong>{" "}
                                    {reviewResult.suggested_follow_up}
                                  </p>
                                ) : null}
                                {reviewResult.platform_reply ? (
                                  <div className="admin-platform-reply">
                                    <p>
                                      <strong>{text.adminPlatformReplyTitle}</strong>
                                    </p>
                                    <p className="admin-platform-reply-note">{text.adminPlatformReplyNote}</p>
                                    <pre className="ai-review-text">{reviewResult.platform_reply}</pre>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            <details className="admin-workbench-details">
                              <summary>{text.adminTimelineAddEvent}</summary>
                              <textarea
                                rows={3}
                                value={customEventMessage}
                                onChange={(event) => setCustomEventMessage(event.target.value)}
                                placeholder={text.adminTimelineAddEventPlaceholder}
                              />
                              <button
                                type="button"
                                className="vote-btn secondary"
                                disabled={isSaving || !customEventMessage.trim()}
                                onClick={() => void handleAddCustomEvent()}
                              >
                                {text.adminTimelineAddEvent}
                              </button>
                            </details>
                          </div>
                        ) : null}

                        {workbenchSection === "prompts" ? (
                          <div className="admin-workbench-section">
                            <div className="section-header">
                              <h3>{text.adminTestingTitle}</h3>
                              <p>{text.adminTestingDescription}</p>
                            </div>

                            <label>
                              {text.adminTestingCases}
                              <select
                                value={selectedTestCaseId ?? "__new__"}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  if (value === "__new__") {
                                    handleNewTestCase();
                                    return;
                                  }
                                  setSelectedTestCaseId(value);
                                }}
                              >
                                <option value="__new__">{text.adminTestingNew}</option>
                                {testCases.map((testCase) => (
                                  <option key={testCase.id} value={testCase.id}>
                                    {testCase.name} ({testCase.kind})
                                  </option>
                                ))}
                              </select>
                            </label>

                            <form
                              className="signal-form admin-editor-form"
                              onSubmit={(event) => {
                                event.preventDefault();
                                void handleSaveTestCase();
                              }}
                            >
                              <label>
                                {text.adminTestingName}
                                <input
                                  value={testName}
                                  onChange={(event) => setTestName(event.target.value)}
                                />
                              </label>

                              <label>
                                {text.adminTestingKind}
                                <select
                                  value={testKind}
                                  onChange={(event) =>
                                    setTestKind(
                                      event.target.value as "moderation" | "response_review"
                                    )
                                  }
                                >
                                  <option value="response_review">response_review</option>
                                  <option value="moderation">moderation</option>
                                </select>
                              </label>

                              <label>
                                {text.adminTestingSystemPrompt}
                                <textarea
                                  rows={6}
                                  value={testSystemPrompt}
                                  onChange={(event) => setTestSystemPrompt(event.target.value)}
                                />
                              </label>

                              <label>
                                {text.adminTestingUserPayload}
                                <textarea
                                  rows={8}
                                  value={testUserPayloadText}
                                  onChange={(event) => setTestUserPayloadText(event.target.value)}
                                  spellCheck={false}
                                />
                              </label>

                              <div className="admin-head-actions">
                                <button type="submit" disabled={isSaving}>
                                  {isSaving ? text.adminSaving : text.adminTestingSaveCase}
                                </button>
                                <button
                                  type="button"
                                  className="admin-primary-btn"
                                  disabled={isTesting}
                                  onClick={() => void handleRunTest()}
                                >
                                  {isTesting ? text.adminTestingRunning : text.adminTestingRun}
                                </button>
                              </div>
                            </form>

                            {testResult ? (
                              <div className="admin-review-result ok">
                                <p>{text.adminTestingResult}</p>
                                <pre className="admin-json">{JSON.stringify(testResult, null, 2)}</pre>
                              </div>
                            ) : null}

                            <details className="admin-workbench-details">
                              <summary>{text.adminTestingRuns}</summary>
                              <ul>
                                {testRuns.slice(0, 8).map((run) => (
                                  <li key={run.id}>
                                    <strong>{run.kind}</strong>{" "}
                                    <span className={run.ok ? "admin-run-ok" : "admin-run-bad"}>
                                      {run.ok ? "ok" : "error"}
                                    </span>
                                    {run.error ? <p>{run.error}</p> : null}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </div>
                        ) : null}
                      </section>
                    )}
                  </>
                ) : null}

                {activeTab === "signals" ? (
                  <section className="card admin-editor">
                    <div className="section-header">
                      <h3>{selectedSignal ? text.adminEditSignal : text.adminSignalCreate}</h3>
                    </div>

                    <form
                      className="signal-form admin-editor-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (selectedSignal) {
                          void handleSaveSignal();
                        } else {
                          void handleCreateSignal();
                        }
                      }}
                    >
                      <label>
                        {text.fieldTitle}
                        <input
                          value={draft.title}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, title: event.target.value }))
                          }
                          required
                        />
                      </label>

                      <label>
                        {text.fieldDescription}
                        <textarea
                          rows={5}
                          value={draft.description}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>

                      <label>
                        {text.fieldDistrict}
                        <select
                          value={draft.district}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, district: event.target.value }))
                          }
                        >
                          <option value="">{text.neighborhoodAll}</option>
                          {neighborhoodOptions.map((neighborhood) => (
                            <option key={neighborhood.id} value={neighborhood.nameBg}>
                              {neighborhood.nameBg}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {text.adminFieldNeighborhoodId}
                        <select
                          value={draft.neighborhoodId}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              neighborhoodId: event.target.value,
                            }))
                          }
                        >
                          <option value="">{text.neighborhoodAll}</option>
                          {neighborhoodOptions.map((neighborhood) => (
                            <option key={neighborhood.id} value={neighborhood.id}>
                              {neighborhood.nameBg}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {text.adminFieldSubmitter}
                        <input
                          value={draft.submitterName}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              submitterName: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <div className="admin-field-row">
                        <label>
                          {text.modalStatus}
                          <select
                            value={draft.status}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                status: event.target.value as SignalStatus,
                              }))
                            }
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel[status]}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          {text.modalPriority}
                          <select
                            value={draft.priority}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                priority: event.target.value as SignalPriority,
                              }))
                            }
                          >
                            {PRIORITIES.map((priority) => (
                              <option key={priority} value={priority}>
                                {priority}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="admin-field-row">
                        <label>
                          {text.adminFieldUpvotes}
                          <input
                            type="number"
                            min={0}
                            value={draft.upvotes}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                upvotes: Number(event.target.value),
                              }))
                            }
                          />
                        </label>

                        <label>
                          {text.adminFieldDownvotes}
                          <input
                            type="number"
                            min={0}
                            value={draft.downvotes}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                downvotes: Number(event.target.value),
                              }))
                            }
                          />
                        </label>
                      </div>

                      <label>
                        {text.adminFieldModerationStatus}
                        <input
                          value={draft.aiModerationStatus}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              aiModerationStatus: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label>
                        {text.adminFieldModerationReason}
                        <textarea
                          rows={3}
                          value={draft.aiModerationReason}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              aiModerationReason: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <div className="admin-head-actions">
                        <button type="submit" disabled={isSaving || isCreatingSignal}>
                          {isSaving || isCreatingSignal
                            ? text.adminSaving
                            : selectedSignal
                              ? text.adminSaveChanges
                              : text.adminSignalCreate}
                        </button>
                        {selectedSignal ? (
                          <button
                            type="button"
                            className="vote-btn secondary"
                            disabled={isSaving}
                            onClick={() => void handleDeleteSignal()}
                          >
                            {text.adminSignalDelete}
                          </button>
                        ) : null}
                      </div>
                    </form>

                    {selectedSignal ? (
                      <section className="admin-attachments">
                        <div className="section-header">
                          <h4>{text.adminAttachmentsTitle}</h4>
                          <p>{text.adminAttachmentsDescription}</p>
                        </div>

                        <div className="admin-head-actions">
                          <input
                            ref={attachmentInputRef}
                            type="file"
                            hidden
                            accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,.doc,.docx"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void handleUploadAttachment(file);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="vote-btn secondary"
                            disabled={isUploadingAttachment}
                            onClick={() => attachmentInputRef.current?.click()}
                          >
                            {isUploadingAttachment ? text.adminAttachmentUploading : text.adminAttachmentUpload}
                          </button>
                        </div>

                        {selectedSignal.attachments.length > 0 ? (
                          <ul className="admin-attachment-list">
                            {selectedSignal.attachments.map((attachment) => (
                              <li key={attachment.id} className="admin-attachment-item">
                                <a href={attachment.publicUrl} target="_blank" rel="noreferrer">
                                  {attachment.fileName}
                                </a>
                                <button
                                  type="button"
                                  className="vote-btn secondary"
                                  disabled={isSaving || isUploadingAttachment}
                                  onClick={() => void handleDeleteAttachment(attachment.id)}
                                >
                                  {text.adminAttachmentDelete}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </section>
                    ) : null}

                    {selectedSignal ? (
                    <section className="admin-timeline-preview">
                      <h4>{text.communicationTitle}</h4>
                      <ul>
                        {selectedSignal.communicationTimeline.map((event) => (
                          <li key={event.id} className={`timeline-${event.actor}`}>
                            <div className="admin-event-row">
                              <div>
                                <strong>{event.eventType}</strong>
                                <p>{event.message}</p>
                              </div>
                              {isUuid(event.id) ? (
                                <button
                                  type="button"
                                  className="vote-btn secondary"
                                  disabled={isSaving}
                                  onClick={() => void handleDeleteTimelineEvent(event.id)}
                                >
                                  {text.adminEventDelete}
                                </button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                    ) : null}
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
