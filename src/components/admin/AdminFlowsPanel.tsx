import { useEffect, useMemo, useState } from "react";
import type { AppTranslations, Locale } from "../../i18n";
import { listAdminFlows, seedAdminFlows, upsertAdminFlow } from "../../lib/adminApi";
import {
  getFlowDescription,
  getFlowLabel,
  getStepDescription,
  getStepTitle,
  reorderFlowSteps,
  sortFlowSteps,
  type FlowActor,
  type FlowDefinitionRow,
  type FlowStepDefinition,
} from "../../lib/flowDefinitions";

interface AdminFlowsPanelProps {
  text: AppTranslations;
  locale: Locale;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

const ACTOR_LABELS: Record<FlowActor, { bg: string; en: string }> = {
  citizen: { bg: "Гражданин", en: "Citizen" },
  ai: { bg: "AI", en: "AI" },
  municipality: { bg: "Община", en: "Municipality" },
  system: { bg: "Система", en: "System" },
};

export function AdminFlowsPanel({ text, locale, onNotice, onError }: AdminFlowsPanelProps) {
  const [flows, setFlows] = useState<FlowDefinitionRow[]>([]);
  const [selectedFlowKey, setSelectedFlowKey] = useState<string | null>(null);
  const [draftSteps, setDraftSteps] = useState<FlowStepDefinition[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.key === selectedFlowKey) ?? null,
    [flows, selectedFlowKey]
  );

  const loadFlows = async () => {
    const nextFlows = await listAdminFlows();
    setFlows(nextFlows);
    if (!selectedFlowKey && nextFlows.length > 0) {
      setSelectedFlowKey(nextFlows[0].key);
    }
  };

  useEffect(() => {
    void loadFlows().catch((error: unknown) => {
      onError(error instanceof Error ? error.message : text.adminError);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedFlow) return;
    setDraftSteps(sortFlowSteps(selectedFlow.steps ?? []));
  }, [selectedFlow]);

  const handleReorder = (stepId: string, direction: "up" | "down") => {
    setDraftSteps((current) => reorderFlowSteps(current, stepId, direction));
  };

  const handleStepFieldChange = (
    stepId: string,
    field: "title" | "description",
    value: string
  ) => {
    setDraftSteps((current) =>
      current.map((step) => {
        if (step.id !== stepId) return step;

        if (field === "title") {
          return locale === "bg" ? { ...step, title_bg: value } : { ...step, title_en: value };
        }

        return locale === "bg"
          ? { ...step, description_bg: value }
          : { ...step, description_en: value };
      })
    );
  };

  const handleSaveFlow = async () => {
    if (!selectedFlow) return;

    setIsSaving(true);
    try {
      const saved = await upsertAdminFlow({
        key: selectedFlow.key,
        name_bg: selectedFlow.name_bg,
        name_en: selectedFlow.name_en,
        description_bg: selectedFlow.description_bg,
        description_en: selectedFlow.description_en,
        steps: draftSteps,
        active: selectedFlow.active,
      });
      setSelectedFlowKey(saved.key);
      await loadFlows();
      onNotice(text.adminSaved);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedFlows = async () => {
    setIsSaving(true);
    try {
      await seedAdminFlows();
      await loadFlows();
      onNotice(text.adminFlowsSeeded);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const actorLabel = (actor: FlowActor) =>
    locale === "bg" ? ACTOR_LABELS[actor].bg : ACTOR_LABELS[actor].en;

  return (
    <div className="admin-flows-panel">
      <section className="card admin-editor">
        <div className="section-header-row">
          <div className="section-header">
            <h3>{text.adminFlowsTitle}</h3>
            <p>{text.adminFlowsDescription}</p>
          </div>
          <button
            type="button"
            className="vote-btn secondary"
            disabled={isSaving}
            onClick={() => void handleSeedFlows()}
          >
            {text.adminFlowsSeedDefaults}
          </button>
        </div>

        <div className="admin-flow-legend" aria-label={text.adminFlowsLegend}>
          {(Object.keys(ACTOR_LABELS) as FlowActor[]).map((actor) => (
            <span key={actor} className={`admin-flow-legend-item actor-${actor}`}>
              {actorLabel(actor)}
            </span>
          ))}
        </div>

        <div className="admin-layout admin-flows-layout">
          <aside className="admin-signal-list card">
            <ul>
              {flows.map((flow) => (
                <li key={flow.key}>
                  <button
                    type="button"
                    className={
                      selectedFlowKey === flow.key ? "admin-signal-item active" : "admin-signal-item"
                    }
                    onClick={() => setSelectedFlowKey(flow.key)}
                  >
                    <strong>{getFlowLabel(flow, locale)}</strong>
                    <span>{flow.key}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {selectedFlow ? (
            <div className="admin-workspace">
              <div className="section-header">
                <h4>{getFlowLabel(selectedFlow, locale)}</h4>
                <p>{getFlowDescription(selectedFlow, locale)}</p>
              </div>

              <div className="admin-flow-diagram" role="list" aria-label={text.adminFlowsDiagram}>
                {draftSteps.map((step, index) => (
                  <div key={step.id} className="admin-flow-diagram-segment" role="listitem">
                    <article className={`admin-flow-step-card actor-${step.actor}`}>
                      <div className="admin-flow-step-head">
                        <span className="admin-flow-step-index">{index + 1}</span>
                        <span className={`admin-flow-step-actor actor-${step.actor}`}>
                          {actorLabel(step.actor)}
                        </span>
                        {step.technical_key ? (
                          <code className="admin-flow-tech-key">{step.technical_key}</code>
                        ) : null}
                      </div>

                      <label>
                        {text.adminFlowsStepTitle}
                        <input
                          value={getStepTitle(step, locale)}
                          onChange={(event) =>
                            handleStepFieldChange(step.id, "title", event.target.value)
                          }
                        />
                      </label>

                      <label>
                        {text.adminFlowsStepDescription}
                        <textarea
                          rows={3}
                          value={getStepDescription(step, locale)}
                          onChange={(event) =>
                            handleStepFieldChange(step.id, "description", event.target.value)
                          }
                        />
                      </label>

                      <div className="admin-flow-step-actions">
                        <button
                          type="button"
                          className="vote-btn secondary"
                          disabled={index === 0 || isSaving}
                          onClick={() => handleReorder(step.id, "up")}
                          aria-label={`${text.adminFlowsMoveUp} ${getStepTitle(step, locale)}`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="vote-btn secondary"
                          disabled={index === draftSteps.length - 1 || isSaving}
                          onClick={() => handleReorder(step.id, "down")}
                          aria-label={`${text.adminFlowsMoveDown} ${getStepTitle(step, locale)}`}
                        >
                          ↓
                        </button>
                      </div>
                    </article>

                    {index < draftSteps.length - 1 ? (
                      <div className="admin-flow-arrow" aria-hidden="true">
                        <span className="admin-flow-arrow-line" />
                        <span className="admin-flow-arrow-head">→</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="admin-head-actions">
                <button
                  type="button"
                  className="admin-primary-btn"
                  disabled={isSaving}
                  onClick={() => void handleSaveFlow()}
                >
                  {isSaving ? text.adminSaving : text.adminFlowsSaveOrder}
                </button>
              </div>
            </div>
          ) : (
            <p className="banner-info">{text.adminFlowsEmpty}</p>
          )}
        </div>
      </section>
    </div>
  );
}
