export interface ResponseReviewInput {
  signalTitle: string;
  signalDescription: string;
  municipalityResponse: string;
}

export interface GroqResponseReview {
  satisfactory: boolean;
  reason: string;
  suggested_follow_up: string;
  platform_reply: string;
}

export const RESPONSE_REVIEW_SYSTEM_PROMPT = `Ти си AI медиатор за „Transparent Ruse“ — гражданска платформа за прозрачност в Русе, България.

Гражданин е подал сигнал. Общината е отговорила. Имаш две задачи:

1) Оцени дали отговорът е ЗАДОВОЛИТЕЛЕН за публична прозрачност.
2) Напиши официален имейл ОТ платформата Transparent Ruse КЪМ общината (platform_reply).

satisfactory: true, когато отговорът:
- Отнася се директно до описания проблем.
- Посочва конкретно действие (извършено, планирано или отказано с обосновка).
- Дава срок, етап или следваща стъпка, ако работата е в процес.
- Е професионален и разбираем за гражданите.

satisfactory: false, когато:
- Е шаблонен без връзка с конкретния сигнал.
- Пренасочва отговорността без обяснение.
- Съдържа само „получихме сигнала“ без смислено действие.
- Е неясен, противоречив или игнорира искането.
- Обещава действие без срок.

При граничен случай — false и обясни какво липсва.

suggested_follow_up — кратка вътрешна бележка на български за админа: какво още да се поиска от общината (само при незадоволителен отговор; при задоволителен — празен низ или „няма“).

platform_reply — готов официален имейл на български ОТ Transparent Ruse КЪМ общината. Задължително на няколко реда с \\n:

При satisfactory: true — благодари, потвърди че сигналът е маркиран като решен в публичното табло.
При satisfactory: false — учтиво поискай конкретни действия, отговорна институция и срок; спомени оригиналния проблем и че отговорът е неясен.

Точна структура на platform_reply:
Здравейте,

[съдържание]

Поздрави,
Transparent Ruse
[ако е даден публичен линк — на отделен ред]

Всички текстове (reason, suggested_follow_up, platform_reply) — на български.

Върни СТРОГО JSON с ключове:
satisfactory (boolean), reason (string), suggested_follow_up (string), platform_reply (string)`;

export function buildResponseReviewUserPrompt(payload: ResponseReviewInput, publicSiteUrl?: string | null) {
  const lines = [
    `Заглавие на сигнала: ${payload.signalTitle}`,
    `Описание на сигнала: ${payload.signalDescription}`,
    `Отговор на общината: ${payload.municipalityResponse}`,
  ];

  if (publicSiteUrl?.trim()) {
    lines.push(`Публичен линк (добави под Transparent Ruse в platform_reply): ${publicSiteUrl.trim()}`);
  }

  return lines.join("\n");
}

function buildLetterClosing(publicSiteUrl?: string | null) {
  const lines = ["Поздрави,", "Transparent Ruse"];
  const url = publicSiteUrl?.trim();
  if (url) {
    lines.push(url);
  }
  return lines.join("\n");
}

export function buildFallbackPlatformReply(
  payload: ResponseReviewInput,
  review: Pick<GroqResponseReview, "satisfactory" | "suggested_follow_up">,
  publicSiteUrl?: string | null
) {
  const closing = buildLetterClosing(publicSiteUrl);

  if (review.satisfactory) {
    return [
      "Здравейте,",
      "",
      `Благодарим за отговора по сигнал „${payload.signalTitle}".`,
      "Сигналът е маркиран като решен в публичното табло на Transparent Ruse.",
      "",
      closing,
    ].join("\n");
  }

  return [
    "Здравейте,",
    "",
    `Отговорът по сигнал „${payload.signalTitle}" не е достатъчно конкретен за публична прозрачност.`,
    "",
    `Оригинален сигнал: ${payload.signalDescription}`,
    `Вашият отговор: ${payload.municipalityResponse}`,
    "",
    review.suggested_follow_up,
    "",
    closing,
  ].join("\n");
}

export function finalizeResponseReview(
  review: GroqResponseReview,
  payload: ResponseReviewInput,
  publicSiteUrl?: string | null
): GroqResponseReview {
  const suggestedFollowUp =
    review.satisfactory || !review.suggested_follow_up?.trim() || /^няма$/i.test(review.suggested_follow_up.trim())
      ? ""
      : review.suggested_follow_up.trim();

  return {
    ...review,
    suggested_follow_up: suggestedFollowUp,
    platform_reply:
      review.platform_reply?.trim() ||
      buildFallbackPlatformReply(payload, review, publicSiteUrl),
  };
}

export function parseResponseReviewContent(content: string): GroqResponseReview {
  let normalized: Partial<GroqResponseReview> = {};

  try {
    normalized = JSON.parse(content) as Partial<GroqResponseReview>;
  } catch {
    return {
      satisfactory: false,
      reason:
        "Отговорът на AI медиатора не може да се прочете. Третирай като незадоволителен до ръчен преглед.",
      suggested_follow_up:
        "Моля, посочете конкретни действия, отговорна институция и срок по този сигнал.",
      platform_reply: "",
    };
  }

  return {
    satisfactory: normalized.satisfactory === true,
    reason: normalized.reason?.trim() || "AI медиаторът не даде обяснение.",
    suggested_follow_up:
      normalized.suggested_follow_up?.trim() ||
      "Моля, уточнете какви действия ще бъдат предприети и до кога.",
    platform_reply: normalized.platform_reply?.trim() || "",
  };
}
