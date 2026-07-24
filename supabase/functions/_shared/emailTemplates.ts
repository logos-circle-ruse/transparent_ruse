export const EMAIL_TEMPLATE_VARIABLES = [
  "signal_title",
  "signal_description",
  "district",
  "signal_id",
  "municipality_response",
  "public_url",
] as const;

export type EmailTemplateVariable = (typeof EMAIL_TEMPLATE_VARIABLES)[number];

export function renderEmailTemplate(
  template: string,
  variables: Partial<Record<EmailTemplateVariable, string>>
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variables[key as EmailTemplateVariable] ?? "");
}

export const SAMPLE_EMAIL_VARIABLES: Record<EmailTemplateVariable, string> = {
  signal_title: "Счупено осветление",
  signal_description: "Лампите около паметника не работят от седмица.",
  district: "Център",
  signal_id: "00000000-0000-0000-0000-000000000001",
  municipality_response: "Получихме сигнала и ще действаме.",
  public_url: "https://logos-circle-ruse.github.io/transparent_ruse/",
};
