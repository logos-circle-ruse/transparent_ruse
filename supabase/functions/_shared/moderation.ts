export interface ModerationInput {
  title: string;
  description: string;
  district?: string;
  submitterName?: string;
  publicSiteUrl?: string;
}

export function resolveCitizenSignoff(submitterName?: string) {
  const name = submitterName?.trim();
  if (!name || /^anonymous$/i.test(name) || name === "Анонимен") {
    return "Анонимен гражданин";
  }
  return name;
}

export function buildLetterClosing(submitterName?: string, publicSiteUrl?: string | null) {
  const lines = ["Поздрави,", resolveCitizenSignoff(submitterName), "", "Transparent Ruse"];
  const url = publicSiteUrl?.trim();
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}

export function buildFormattedLetterBody(
  payload: ModerationInput,
  bodyParagraphs: string[],
  publicSiteUrl?: string | null
) {
  const intro = "Здравейте,";
  const paragraphs = bodyParagraphs.map((paragraph) => paragraph.trim()).filter(Boolean);
  const closing = buildLetterClosing(payload.submitterName, publicSiteUrl);

  return [intro, "", ...paragraphs.flatMap((paragraph) => [paragraph, ""]), closing].join("\n");
}

export function finalizeFormattedDescription(
  formatted: string,
  payload: ModerationInput,
  publicSiteUrl?: string | null
) {
  const closing = buildLetterClosing(payload.submitterName, publicSiteUrl);
  let body = formatted.trim();

  body = body.replace(/\n*Поздрави,\s*[\s\S]*$/i, "").trim();
  if (!body.startsWith("Здравейте")) {
    body = `Здравейте,\n\n${body}`;
  }

  return `${body}\n\n${closing}`;
}

export interface GroqModeration {
  decision: "approved" | "rejected";
  reason: string;
  duplicate_hint: string;
  formatted_title: string;
  formatted_description: string;
  allow_original: boolean;
  summary: string;
}

/**
 * Единна AI стъпка при подаване: модерация + официално форматиране за общината.
 * Всички текстове към потребителя (reason, summary) са на български.
 */
export const MODERATION_SYSTEM_PROMPT = `Ти си AI асистент за модерация и официално форматиране на граждански сигнали в платформата „Transparent Ruse“ (Русе, България).

Задачи:
1) Реши дали сигналът може да бъде публикуван (APPROVED) или трябва да бъде отхвърлен (REJECTED).
2) Подготви официален текст за общината на български език.
3) Дай кратко резюме на български за публичната линия на комуникация.

ОДОБРИ (decision: "approved"), когато:
- Описан е реален граждански/общински проблем (пътища, осветление, отпадъци, вода, паркове, транспорт, шум, замърсяване, опасност, незаконно строителство/изхвърляне, безстопанствени животни и т.н.), дори неформално написан.
- Липсват някои детайли — одобри и остави уточнение на общината.
- Има критика към институция/фирма по фактически начин, без клевета към частно лице.

ОТХВЪРЛИ (decision: "rejected") САМО когато ясно:
- Няма реално съдържание (празно, тест, gibberish).
- Няма описан граждански проблем — само реклама, spam, фишинг.
- Лична атака/тормоз към частно лице без граждански проблем.
- Няма никакъв смисъл и не може да се поправи чрез форматиране.

При гранични случаи — ОДОБРИ. По-добре е фалшиво одобрение, отколкото да блокираме легитимен сигнал.

allow_original:
- true — текстът е приемлив; потребителят може да избере оригинала или форматирания вариант.
- false — в оригинала има нецензурни думи, обиди или твърде агресивен тон; потребителят ТРЯБВА да използва само formatted_description (почистен, професионален текст). Не отхвърляй само заради псувни — поправи ги в formatted_description и сложи allow_original: false.

formatted_description — официално писмо до общината на български. Задължително на няколко реда с празни редове между абзаците. Използвай \\n за нов ред в JSON стойността. Точна структура:

Здравейте,

[абзац 1: какъв е проблемът]

[абзац 2: къде/квартал, от колко време, риск, какво се очаква]

Поздрави,
[име на подателя от подсказката — или „Анонимен гражданин“]

Transparent Ruse
[ако е даден публичен линк — добави го на отделен ред под Transparent Ruse]

Задължително завършвай с блока Поздрави + име + Transparent Ruse (+ линк ако има). Не слагай други подписи.

formatted_title — ясно, неутрално, професионално заглавие на български (до ~120 символа). Поправи правопис, махни псувни/емоции, запази смисъла на проблема.

summary — едно кратко изречение на български за публичното табло.

reason — кратко обяснение на български, показвано директно на подателя. При rejected — кажи какво да промени. При allow_original: false — обясни защо се предлага само форматираният текст.

duplicate_hint — "none" или кратко описание на spam шаблон.

Върни СТРОГО JSON с ключове:
decision, reason, duplicate_hint, formatted_title, formatted_description, allow_original, summary`;

export function buildModerationUserPrompt(payload: ModerationInput) {
  const lines = [
    `Заглавие: ${payload.title}`,
    `Описание: ${payload.description}`,
    `Квартал: ${payload.district ?? "Неуточнен"}`,
    payload.submitterName?.trim()
      ? `Подател за подпис: ${resolveCitizenSignoff(payload.submitterName)}`
      : "Подател за подпис: Анонимен гражданин",
  ];

  if (payload.publicSiteUrl?.trim()) {
    lines.push(`Публичен линк към платформата (добави под Transparent Ruse): ${payload.publicSiteUrl.trim()}`);
  }

  return lines.join("\n");
}

function fallbackFormattedDescription(payload: ModerationInput, publicSiteUrl?: string | null) {
  const districtLine = payload.district?.trim()
    ? `Квартал/локация: ${payload.district.trim()}.`
    : "Квартал/локация: неуточнена.";

  return buildFormattedLetterBody(
    payload,
    [payload.description.trim(), districtLine],
    publicSiteUrl ?? payload.publicSiteUrl
  );
}

export function parseModerationContent(
  content: string,
  payload?: ModerationInput,
  publicSiteUrl?: string | null
): GroqModeration {
  let normalized: Partial<GroqModeration> = {};

  try {
    normalized = JSON.parse(content) as Partial<GroqModeration>;
  } catch {
    const fallbackDescription = payload
      ? fallbackFormattedDescription(payload, publicSiteUrl)
      : "";
    return {
      decision: "approved",
      reason: "Отговорът на AI не може да се прочете. Сигналът е приет по резервна политика.",
      duplicate_hint: "none",
      formatted_title: payload?.title?.trim() || "",
      formatted_description: fallbackDescription,
      allow_original: true,
      summary: payload?.description?.slice(0, 180) || "Граждански сигнал.",
    };
  }

  const formattedTitle = normalized.formatted_title?.trim() || payload?.title?.trim() || "";
  const rawFormattedDescription =
    normalized.formatted_description?.trim() ||
    (payload ? fallbackFormattedDescription(payload, publicSiteUrl) : "");
  const formattedDescription = payload
    ? finalizeFormattedDescription(rawFormattedDescription, payload, publicSiteUrl ?? payload.publicSiteUrl)
    : rawFormattedDescription;

  return {
    decision: normalized.decision === "rejected" ? "rejected" : "approved",
    reason: normalized.reason?.trim() || "AI не върна обяснение.",
    duplicate_hint: normalized.duplicate_hint?.trim() || "none",
    formatted_title: formattedTitle,
    formatted_description: formattedDescription,
    allow_original: normalized.allow_original !== false,
    summary: normalized.summary?.trim() || payload?.description?.slice(0, 180) || "Граждански сигнал.",
  };
}

export interface DuplicateCandidate {
  id: string;
  title: string;
  description: string;
}

export function findDuplicateSignal<T extends DuplicateCandidate>(
  candidates: T[],
  payload: Pick<ModerationInput, "title" | "description">
): T | undefined {
  const sample = `${payload.title} ${payload.description}`.toLowerCase().trim();
  if (sample.length < 15) {
    return undefined;
  }

  const prefixLength = Math.min(30, sample.length);
  const samplePrefix = sample.slice(0, prefixLength);

  return candidates.find((candidate) => {
    const candidateText = `${candidate.title} ${candidate.description}`.toLowerCase();
    return candidateText.includes(samplePrefix);
  });
}

export function resolveSubmittedDescription(
  moderation: GroqModeration,
  payload: ModerationInput,
  choice: "formatted" | "original"
) {
  if (moderation.decision === "rejected") {
    throw new Error("Rejected moderation cannot be submitted.");
  }

  if (choice === "original") {
    if (!moderation.allow_original) {
      throw new Error("Original text is not allowed for this signal.");
    }
    return {
      title: payload.title.trim(),
      description: payload.description.trim(),
      source: "original" as const,
    };
  }

  return {
    title: moderation.formatted_title.trim() || payload.title.trim(),
    description: moderation.formatted_description.trim() || payload.description.trim(),
    source: "formatted" as const,
  };
}
