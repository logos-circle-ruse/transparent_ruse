export type {
  FlowActor,
  FlowDefinitionSeed,
  FlowStepDefinition,
} from "../../supabase/functions/_shared/flowDefinitions.ts";

export {
  DEFAULT_FLOW_DEFINITIONS,
  reorderFlowSteps,
  sortFlowSteps,
} from "../../supabase/functions/_shared/flowDefinitions.ts";

export interface FlowDefinitionRow {
  key: string;
  name_bg: string;
  name_en: string;
  description_bg: string;
  description_en: string;
  steps: import("../../supabase/functions/_shared/flowDefinitions.ts").FlowStepDefinition[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function getFlowLabel(flow: Pick<FlowDefinitionRow, "name_bg" | "name_en">, locale: "bg" | "en") {
  return locale === "bg" ? flow.name_bg : flow.name_en;
}

export function getFlowDescription(
  flow: Pick<FlowDefinitionRow, "description_bg" | "description_en">,
  locale: "bg" | "en"
) {
  return locale === "bg" ? flow.description_bg : flow.description_en;
}

export function getStepTitle(
  step: Pick<import("../../supabase/functions/_shared/flowDefinitions.ts").FlowStepDefinition, "title_bg" | "title_en">,
  locale: "bg" | "en"
) {
  return locale === "bg" ? step.title_bg : step.title_en;
}

export function getStepDescription(
  step: Pick<
    import("../../supabase/functions/_shared/flowDefinitions.ts").FlowStepDefinition,
    "description_bg" | "description_en"
  >,
  locale: "bg" | "en"
) {
  return locale === "bg" ? step.description_bg : step.description_en;
}
