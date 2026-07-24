import type { SignalStatus } from "./types";

export type Locale = "bg" | "en";
export type Theme = "dark" | "light";

export interface AppTranslations {
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroSubmitDescription: string;
  languageLabel: string;
  themeLabel: string;
  menuDashboard: string;
  menuSubmit: string;
  menuOpen: string;
  menuClose: string;
  menuPriority: string;
  priorityAll: string;
  priorityCritical: string;
  priorityHigh: string;
  priorityNormal: string;
  signalsTitle: string;
  signalsDescription: string;
  overviewTitle: string;
  overviewDescription: string;
  noSignals: string;
  fallbackNotice: string;
  loading: string;
  errorPrefix: string;
  formTitle: string;
  formDescription: string;
  formSubmit: string;
  formSubmitting: string;
  formAiReview: string;
  formAiReviewing: string;
  formSuccess: string;
  formErrorPrefix: string;
  formAiReviewTitle: string;
  formAiReviewDescription: string;
  formAiReviewReason: string;
  formAiFormattedLabel: string;
  formAiFormattedTitleLabel: string;
  formAiOriginalLabel: string;
  formAiUseFormatted: string;
  formAiUseOriginal: string;
  formAiEditAgain: string;
  formAiMustUseFormatted: string;
  formAiPreviewExpired: string;
  fieldTitle: string;
  fieldDescription: string;
  fieldDistrict: string;
  fieldName: string;
  fieldAttachments: string;
  cameraCapture: string;
  chooseFiles: string;
  attachmentsSelected: string;
  dropFilesHint: string;
  removeFile: string;
  attachmentsGallery: string;
  turnstileHint: string;
  turnstileRequired: string;
  statsCtaTitle: string;
  statsCtaDescription: string;
  statsCtaButton: string;
  statsSignals: string;
  statsPending: string;
  statsCritical: string;
  openDetails: string;
  closeDetails: string;
  voteUp: string;
  voteDown: string;
  votesScore: string;
  modalDistrict: string;
  modalStatus: string;
  modalPriority: string;
  communicationTitle: string;
  communicationEventOriginalSignal: string;
  communicationEventAiSummary: string;
  communicationEventSubmittedToMunicipality: string;
  communicationEventMunicipalityResponse: string;
  communicationEventAiResponseReview: string;
  communicationEventPlatformFollowUp: string;
  communicationSatisfactory: string;
  communicationUnsatisfactory: string;
  communicationNoResponseYet: string;
  voteSuccess: string;
  voteError: string;
  mapTitle: string;
  mapDescription: string;
  neighborhoodFilter: string;
  neighborhoodAll: string;
  neighborhoodStats: string;
  neighborhoodSignals: string;
  mapOpenSignal: string;
  mapClickHint: string;
  mapLegendTitle: string;
  mapNoSignals: string;
  mapSeeAllNeighborhoods: string;
  mapSeeLessNeighborhoods: string;
  adminTitle: string;
  adminSubtitle: string;
  adminLoginTitle: string;
  adminLoginDescription: string;
  adminLoginError: string;
  adminEmail: string;
  adminPassword: string;
  adminSignIn: string;
  adminSigningIn: string;
  adminSignOut: string;
  adminBackToPublic: string;
  adminTabSignals: string;
  adminTabWorkbench: string;
  adminTabSettings: string;
  adminTabAiMediator: string;
  adminTabMunicipalityFlow: string;
  adminLoading: string;
  adminError: string;
  adminSaved: string;
  adminSaving: string;
  adminSelectSignal: string;
  adminEditSignal: string;
  adminSaveChanges: string;
  adminFieldSubmitter: string;
  adminFieldModerationStatus: string;
  adminFieldModerationReason: string;
  adminFieldNeighborhoodId: string;
  adminFieldUpvotes: string;
  adminFieldDownvotes: string;
  adminTimelineAddEvent: string;
  adminTimelineAddEventPlaceholder: string;
  adminAiMediatorTitle: string;
  adminAiMediatorDescription: string;
  adminMunicipalityResponse: string;
  adminMunicipalityResponsePlaceholder: string;
  adminRunAiReview: string;
  adminReviewing: string;
  adminReviewSatisfactory: string;
  adminReviewUnsatisfactory: string;
  adminSuggestedFollowUp: string;
  adminPlatformReplyTitle: string;
  adminPlatformReplyNote: string;
  adminSimulateFlow: string;
  adminSimulating: string;
  adminFlowSuccess: string;
  adminMunicipalityFlowDescription: string;
  adminFlowStep1: string;
  adminFlowStep2: string;
  adminFlowStep3: string;
  adminFlowStep4: string;
  adminNoSignals: string;
  adminTestingTab: string;
  adminTestingTitle: string;
  adminTestingDescription: string;
  adminTestingCases: string;
  adminTestingNew: string;
  adminTestingName: string;
  adminTestingKind: string;
  adminTestingSystemPrompt: string;
  adminTestingUserPayload: string;
  adminTestingSaveCase: string;
  adminTestingRun: string;
  adminTestingRunning: string;
  adminTestingResult: string;
  adminTestingRuns: string;
  adminCatalogTab: string;
  adminUsersTab: string;
  adminCatalogNeighborhoodsTitle: string;
  adminCatalogNeighborhoodsDescription: string;
  adminCatalogNeighborhoodSelect: string;
  adminCatalogSeedNeighborhoods: string;
  adminCatalogNameBg: string;
  adminCatalogNameEn: string;
  adminCatalogAliases: string;
  adminCatalogNew: string;
  adminCatalogDelete: string;
  adminCatalogPromptsTitle: string;
  adminCatalogPromptsDescription: string;
  adminCatalogPromptDescription: string;
  adminCatalogSeeded: string;
  adminUsersTitle: string;
  adminUsersDescription: string;
  adminUsersDisplayName: string;
  adminUsersAdd: string;
  adminUsersRemove: string;
  adminUsersAdded: string;
  adminSignalCreate: string;
  adminSignalDelete: string;
  adminSignalCreated: string;
  adminSignalDeleted: string;
  adminEventDelete: string;
  adminAttachmentsTitle: string;
  adminAttachmentsDescription: string;
  adminAttachmentUpload: string;
  adminAttachmentUploading: string;
  adminAttachmentDelete: string;
  adminCatalogEmailsTitle: string;
  adminCatalogEmailsDescription: string;
  adminEmailTemplateSubject: string;
  adminEmailTemplateBody: string;
  adminEmailTemplateRecipient: string;
  adminEmailTemplateActive: string;
  adminEmailTemplatePreview: string;
  adminEmailTemplateVariables: string;
  adminEmailTemplateSendTest: string;
  adminEmailTestSent: string;
  adminEmailPreviewSubject: string;
  adminEmailPreviewBody: string;
  adminFlowsTab: string;
  adminFlowsTitle: string;
  adminFlowsDescription: string;
  adminFlowsSeedDefaults: string;
  adminFlowsLegend: string;
  adminFlowsDiagram: string;
  adminFlowsStepTitle: string;
  adminFlowsStepDescription: string;
  adminFlowsMoveUp: string;
  adminFlowsMoveDown: string;
  adminFlowsSaveOrder: string;
  adminFlowsEmpty: string;
  adminFlowsSeeded: string;
  adminFlowsSeeDiagram: string;
  adminSettingsNav: string;
  adminWorkbenchNav: string;
  adminWorkbenchMunicipality: string;
  adminWorkbenchPrompts: string;
  adminWorkbenchMunicipalityTitle: string;
  adminWorkbenchSelectSignal: string;
}

export const translations: Record<Locale, AppTranslations> = {
  bg: {
    eyebrow: "Гражданска платформа за прозрачност",
    heroTitle: "Transparent Ruse",
    heroDescription:
      "Проследявай сигнали, наблюдавай общинските отговори и виж публичния напредък с отворени данни.",
    heroSubmitDescription:
      "Подай сигнал с текст, снимка от камера и прикачени файлове.",
    languageLabel: "Език",
    themeLabel: "Тема",
    menuDashboard: "Табло",
    menuSubmit: "Подай сигнал",
    menuOpen: "Отвори меню",
    menuClose: "Затвори меню",
    menuPriority: "Важност",
    priorityAll: "Всички",
    priorityCritical: "Критични",
    priorityHigh: "Високи",
    priorityNormal: "Нормални",
    signalsTitle: "Публични сигнали",
    signalsDescription:
      "Прозрачен списък с граждански сигнали и техния текущ статус.",
    overviewTitle: "Преглед по статус",
    overviewDescription:
      "Разпределение на всички сигнали според актуалния им статус.",
    noSignals: "Все още няма публикувани сигнали.",
    fallbackNotice: "Показани са локални примерни данни.",
    loading: "Зареждане на сигнали...",
    errorPrefix: "Проблем при зареждане",
    formTitle: "Подай нов сигнал",
    formDescription:
      "Първо AI проверява и форматира текста като официално писмо до общината. След това избираш дали да изпратиш форматирания или оригиналния вариант.",
    formSubmit: "Изпрати сигнала",
    formSubmitting: "Изпращане...",
    formAiReview: "Подай за проверка",
    formAiReviewing: "Изпраща се за проверка...",
    formSuccess: "Сигналът е изпратен успешно.",
    formErrorPrefix: "Неуспешно изпращане",
    formAiReviewTitle: "Предложена версия на сигнала",
    formAiReviewDescription:
      "AI подготви официален текст за общината. Прегледай и избери коя версия да се публикува.",
    formAiReviewReason: "Обяснение от AI",
    formAiFormattedLabel: "Форматиран текст (за общината)",
    formAiFormattedTitleLabel: "Форматирано заглавие",
    formAiOriginalLabel: "Твоят оригинален текст",
    formAiUseFormatted: "Използвай форматирания текст",
    formAiUseOriginal: "Запази моя текст",
    formAiEditAgain: "Редактирай отново",
    formAiMustUseFormatted:
      "Оригиналният текст съдържа нецензурни или агресивни думи. Можеш да продължиш само с форматирания вариант.",
    formAiPreviewExpired: "Проверката е изтекла. Натисни „Подай за проверка“ отново.",
    fieldTitle: "Заглавие",
    fieldDescription: "Описание",
    fieldDistrict: "Квартал/район",
    fieldName: "Подател",
    fieldAttachments: "Снимки и файлове",
    cameraCapture: "Снимка с камера",
    chooseFiles: "Избор на файлове",
    attachmentsSelected: "Избрани файлове",
    dropFilesHint: "Или пусни файловете тук (drag & drop)",
    removeFile: "Премахни",
    attachmentsGallery: "Прикачени файлове",
    turnstileHint: "Потвърди, че си човек",
    turnstileRequired: "Моля потвърди Turnstile проверката преди изпращане.",
    statsCtaTitle: "Русе става по-добър, когато подаваме сигнали навреме.",
    statsCtaDescription:
      "Виж публичната статистика и добави нов сигнал, за да ускорим реакцията на институциите.",
    statsCtaButton: "Към подаване на сигнал",
    statsSignals: "Общо сигнали",
    statsPending: "В изчакване",
    statsCritical: "Критични",
    openDetails: "Детайли",
    closeDetails: "Затвори",
    voteUp: "Подкрепям",
    voteDown: "Не е релевантно",
    votesScore: "Рейтинг",
    modalDistrict: "Район",
    modalStatus: "Статус",
    modalPriority: "Важност",
    communicationTitle: "Линия на комуникацията",
    communicationEventOriginalSignal: "Оригинален сигнал",
    communicationEventAiSummary: "AI обобщение",
    communicationEventSubmittedToMunicipality: "Подадено към общината",
    communicationEventMunicipalityResponse: "Отговор от общината",
    communicationEventAiResponseReview: "AI оценка на отговора",
    communicationEventPlatformFollowUp: "Отговор на платформата към общината",
    communicationSatisfactory: "Отговорът е задоволителен",
    communicationUnsatisfactory: "Отговорът не е задоволителен",
    communicationNoResponseYet: "Все още няма отговор от общината.",
    voteSuccess: "Гласът е отчетен успешно.",
    voteError: "Неуспешно гласуване.",
    mapTitle: "Карта на сигналите по квартали",
    mapDescription:
      "Визуализира сигналите в Русе и показва натоварването на всеки квартал.",
    neighborhoodFilter: "Квартал",
    neighborhoodAll: "Всички квартали",
    neighborhoodStats: "Статистика по квартали",
    neighborhoodSignals: "сигнала",
    mapOpenSignal: "Отвори сигнал",
    mapClickHint: "Кликни върху очертание на квартал за филтър.",
    mapLegendTitle: "Оцветяване по тип сигнал",
    mapNoSignals: "Няма сигнали",
    mapSeeAllNeighborhoods: "Виж всички",
    mapSeeLessNeighborhoods: "Скрий",
    adminTitle: "Админ портал",
    adminSubtitle:
      "Сигурен достъп за редакция на сигнали, тестване на AI медиатора и симулация на общинските флоуове.",
    adminLoginTitle: "Вход за администратори",
    adminLoginDescription:
      "Влез с акаунт, добавен в admin_profiles. Публичният сайт остава отворен без вход.",
    adminLoginError: "Грешка при вход. Провери имейл, парола и админ правата.",
    adminEmail: "Имейл",
    adminPassword: "Парола",
    adminSignIn: "Вход",
    adminSigningIn: "Влизане...",
    adminSignOut: "Изход",
    adminBackToPublic: "Към публичния сайт",
    adminTabSignals: "Сигнали",
    adminTabWorkbench: "Работно място",
    adminTabSettings: "Настройки",
    adminTabAiMediator: "AI медиатор",
    adminTabMunicipalityFlow: "Общински флоу",
    adminLoading: "Зареждане на админ данни...",
    adminError: "Админ операцията неуспешна.",
    adminSaved: "Промените са запазени.",
    adminSaving: "Запазване...",
    adminSelectSignal: "Избери сигнал",
    adminEditSignal: "Редакция на сигнал",
    adminSaveChanges: "Запази промените",
    adminFieldSubmitter: "Подател",
    adminFieldModerationStatus: "AI модерация статус",
    adminFieldModerationReason: "AI модерация причина",
    adminFieldNeighborhoodId: "Каноничен квартал (ID)",
    adminFieldUpvotes: "Upvotes",
    adminFieldDownvotes: "Downvotes",
    adminTimelineAddEvent: "Добави системно събитие",
    adminTimelineAddEventPlaceholder: "Напр. Ръчно изпратено към общината по имейл...",
    adminAiMediatorTitle: "Тест на AI медиатора",
    adminAiMediatorDescription:
      "Постави примерен отговор от общината и виж дали AI го оценява като задоволителен.",
    adminMunicipalityResponse: "Отговор от общината",
    adminMunicipalityResponsePlaceholder:
      "Пример: Ще изпратим екип за оглед до 15.07.2026 г.",
    adminRunAiReview: "Пусни AI оценка",
    adminReviewing: "AI оценява...",
    adminReviewSatisfactory: "AI: отговорът е задоволителен",
    adminReviewUnsatisfactory: "AI: отговорът не е задоволителен",
    adminSuggestedFollowUp: "Вътрешна бележка за админа:",
    adminPlatformReplyTitle: "Отговор на платформата към общината",
    adminPlatformReplyNote: "Този текст се записва при пълна симулация и може да се изпрати като follow-up имейл.",
    adminSimulateFlow: "Симулирай пълен общински флоу",
    adminSimulating: "Симулация...",
    adminFlowSuccess:
      "Флоуът е записан: отговор от общината + AI оценка + отговор на платформата + обновен статус.",
    adminMunicipalityFlowDescription:
      "Симулира входящ отговор от общината, AI оценява и генерира официален отговор на платформата към тях.",
    adminFlowStep1: "1. Записва отговор от общината",
    adminFlowStep2: "2. AI медиатор оценява отговора (на български)",
    adminFlowStep3: "3. Генерира и записва отговор на платформата към общината",
    adminFlowStep4: "4. Обновява статуса (Resolved / No Response)",
    adminNoSignals: "Няма сигнали за управление.",
    adminTestingTab: "Тестове",
    adminTestingTitle: "Test Bench",
    adminTestingDescription:
      "Редактирай промпта, виж входните данни (payload) и стартирай тест. Случаите и run-овете се пазят в базата, за да може друг човек да ги поддържа.",
    adminTestingCases: "Тестови случаи",
    adminTestingNew: "Нов тест",
    adminTestingName: "Име на теста",
    adminTestingKind: "Тип",
    adminTestingSystemPrompt: "System prompt",
    adminTestingUserPayload: "User payload (JSON)",
    adminTestingSaveCase: "Запази теста",
    adminTestingRun: "Пусни тест",
    adminTestingRunning: "Тества се...",
    adminTestingResult: "Резултат (parsed JSON)",
    adminTestingRuns: "Последни run-ове",
    adminCatalogTab: "Каталог",
    adminUsersTab: "Админи",
    adminCatalogNeighborhoodsTitle: "Квартали",
    adminCatalogNeighborhoodsDescription: "За форми и филтри.",
    adminCatalogNeighborhoodSelect: "Избери квартал",
    adminCatalogSeedNeighborhoods: "Импорт",
    adminCatalogNameBg: "Име (BG)",
    adminCatalogNameEn: "Име (EN)",
    adminCatalogAliases: "Алиаси",
    adminCatalogNew: "Нов запис",
    adminCatalogDelete: "Изтрий",
    adminCatalogPromptsTitle: "AI промптове",
    adminCatalogPromptsDescription: "Редактирай system prompt-овете, които се ползват от AI модерацията и медиатора.",
    adminCatalogPromptDescription: "Описание",
    adminCatalogSeeded: "Кварталите са импортирани.",
    adminUsersTitle: "Админ потребители",
    adminUsersDescription: "Добавяй/махай достъп до админ портала чрез Supabase Auth имейл.",
    adminUsersDisplayName: "Показвано име",
    adminUsersAdd: "Добави админ",
    adminUsersRemove: "Премахни",
    adminUsersAdded: "Админът е добавен.",
    adminSignalCreate: "Нов сигнал",
    adminSignalDelete: "Изтрий сигнал",
    adminSignalCreated: "Сигналът е създаден.",
    adminSignalDeleted: "Сигналът е изтрит.",
    adminEventDelete: "Изтрий",
    adminAttachmentsTitle: "Прикачени файлове",
    adminAttachmentsDescription: "Качвай и изтривай снимки/документи към сигнала.",
    adminAttachmentUpload: "Качи файл",
    adminAttachmentUploading: "Качване...",
    adminAttachmentDelete: "Изтрий файл",
    adminCatalogEmailsTitle: "Имейл шаблони",
    adminCatalogEmailsDescription: "Шаблони за изходяща комуникация с общината.",
    adminEmailTemplateSubject: "Тема",
    adminEmailTemplateBody: "Текст",
    adminEmailTemplateRecipient: "Получател (default)",
    adminEmailTemplateActive: "Активен",
    adminEmailTemplatePreview: "Преглед",
    adminEmailTemplateVariables:
      "Променливи: {{signal_title}}, {{signal_description}}, {{district}}, {{signal_id}}, {{municipality_response}}, {{public_url}}",
    adminEmailTemplateSendTest: "Изпрати тестов имейл",
    adminEmailTestSent: "Тестовият имейл е изпратен.",
    adminEmailPreviewSubject: "Преглед на тема",
    adminEmailPreviewBody: "Преглед на текст",
    adminFlowsTab: "Флоуове",
    adminFlowsTitle: "Диаграма на процесите",
    adminFlowsDescription:
      "Визуална схема със стрелки: какво се случва при подаване, отговор от общината и гражданско участие. Пренареди стъпките с ↑/↓.",
    adminFlowsSeedDefaults: "Възстанови default флоуове",
    adminFlowsLegend: "Участници в процеса",
    adminFlowsDiagram: "Диаграма на стъпките",
    adminFlowsStepTitle: "Заглавие на стъпка",
    adminFlowsStepDescription: "Обяснение",
    adminFlowsMoveUp: "Премести нагоре",
    adminFlowsMoveDown: "Премести надолу",
    adminFlowsSaveOrder: "Запази реда и текстовете",
    adminFlowsEmpty: "Няма конфигурирани флоуове. Натисни „Възстанови default флоуове“.",
    adminFlowsSeeded: "Default флоуовете са заредени.",
    adminFlowsSeeDiagram:
      "Пълната диаграма на процесите е в Настройки → Флоуове.",
    adminSettingsNav: "Настройки на платформата",
    adminWorkbenchNav: "Режим на работно място",
    adminWorkbenchMunicipality: "Общински отговор",
    adminWorkbenchPrompts: "AI тестове",
    adminWorkbenchMunicipalityTitle: "Тест и симулация на общински отговор",
    adminWorkbenchSelectSignal: "Избери сигнал от списъка вляво, за да тестваш отговор или AI промптове.",
  },
  en: {
    eyebrow: "Civic Transparency Platform",
    heroTitle: "Transparent Ruse",
    heroDescription:
      "Track public signals, monitor municipal responses, and expose progress with open civic data.",
    heroSubmitDescription:
      "Submit a signal with text, camera photo capture, and file attachments.",
    languageLabel: "Language",
    themeLabel: "Theme",
    menuDashboard: "Dashboard",
    menuSubmit: "Submit Signal",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    menuPriority: "Priority",
    priorityAll: "All",
    priorityCritical: "Critical",
    priorityHigh: "High",
    priorityNormal: "Normal",
    signalsTitle: "Public Signals",
    signalsDescription: "Transparent, timestamped list of reported civic issues.",
    overviewTitle: "Status Overview",
    overviewDescription: "Live distribution of all public signals by current status.",
    noSignals: "No public signals are available yet.",
    fallbackNotice: "Showing local sample data.",
    loading: "Loading signals...",
    errorPrefix: "Failed to load",
    formTitle: "Submit a New Signal",
    formDescription:
      "AI first reviews and formats your text as an official letter to the municipality. Then you choose the formatted or original version.",
    formSubmit: "Submit signal",
    formSubmitting: "Submitting...",
    formAiReview: "Submit for review",
    formAiReviewing: "Sending for review...",
    formSuccess: "Signal submitted successfully.",
    formErrorPrefix: "Submission failed",
    formAiReviewTitle: "Proposed signal version",
    formAiReviewDescription:
      "AI prepared an official municipality letter. Review it and choose which version to publish.",
    formAiReviewReason: "AI explanation",
    formAiFormattedLabel: "Formatted text (for municipality)",
    formAiFormattedTitleLabel: "Formatted title",
    formAiOriginalLabel: "Your original text",
    formAiUseFormatted: "Use formatted text",
    formAiUseOriginal: "Keep my text",
    formAiEditAgain: "Edit again",
    formAiMustUseFormatted:
      "Your original text contains profanity or aggressive language. You can only continue with the formatted version.",
    formAiPreviewExpired: "Review expired. Click “Submit for review” again.",
    fieldTitle: "Title",
    fieldDescription: "Description",
    fieldDistrict: "District",
    fieldName: "Submitter",
    fieldAttachments: "Photos and files",
    cameraCapture: "Capture photo",
    chooseFiles: "Choose files",
    attachmentsSelected: "Selected files",
    dropFilesHint: "Or drop files here (drag & drop)",
    removeFile: "Remove",
    attachmentsGallery: "Attachments",
    turnstileHint: "Verify you are human",
    turnstileRequired: "Please complete Turnstile verification before submitting.",
    statsCtaTitle: "Ruse improves when citizens report issues early.",
    statsCtaDescription:
      "Review the public statistics and submit a new signal to accelerate municipal response.",
    statsCtaButton: "Go to submit signal",
    statsSignals: "Total signals",
    statsPending: "Pending",
    statsCritical: "Critical",
    openDetails: "Details",
    closeDetails: "Close",
    voteUp: "Relevant",
    voteDown: "Not relevant",
    votesScore: "Score",
    modalDistrict: "District",
    modalStatus: "Status",
    modalPriority: "Priority",
    communicationTitle: "Communication timeline",
    communicationEventOriginalSignal: "Original signal",
    communicationEventAiSummary: "AI summary",
    communicationEventSubmittedToMunicipality: "Submitted to municipality",
    communicationEventMunicipalityResponse: "Municipality response",
    communicationEventAiResponseReview: "AI response review",
    communicationEventPlatformFollowUp: "Platform reply to municipality",
    communicationSatisfactory: "Response is satisfactory",
    communicationUnsatisfactory: "Response is not satisfactory",
    communicationNoResponseYet: "No municipality response yet.",
    voteSuccess: "Vote submitted successfully.",
    voteError: "Voting failed.",
    mapTitle: "Signal map by neighborhoods",
    mapDescription:
      "Visualize Ruse signals and compare issue concentration across neighborhoods.",
    neighborhoodFilter: "Neighborhood",
    neighborhoodAll: "All neighborhoods",
    neighborhoodStats: "Neighborhood statistics",
    neighborhoodSignals: "signals",
    mapOpenSignal: "Open signal",
    mapClickHint: "Click a neighborhood polygon to filter.",
    mapLegendTitle: "Color by signal type",
    mapNoSignals: "No signals",
    mapSeeAllNeighborhoods: "See all",
    mapSeeLessNeighborhoods: "Show less",
    adminTitle: "Admin Portal",
    adminSubtitle:
      "Secure access to edit signals, test the AI mediator, and simulate municipality communication flows.",
    adminLoginTitle: "Administrator sign in",
    adminLoginDescription:
      "Sign in with an account listed in admin_profiles. The public site stays open without login.",
    adminLoginError: "Sign in failed. Check email, password, and admin access.",
    adminEmail: "Email",
    adminPassword: "Password",
    adminSignIn: "Sign in",
    adminSigningIn: "Signing in...",
    adminSignOut: "Sign out",
    adminBackToPublic: "Back to public site",
    adminTabSignals: "Signals",
    adminTabWorkbench: "Workbench",
    adminTabSettings: "Settings",
    adminTabAiMediator: "AI mediator",
    adminTabMunicipalityFlow: "Municipality flow",
    adminLoading: "Loading admin data...",
    adminError: "Admin operation failed.",
    adminSaved: "Changes saved.",
    adminSaving: "Saving...",
    adminSelectSignal: "Select signal",
    adminEditSignal: "Edit signal",
    adminSaveChanges: "Save changes",
    adminFieldSubmitter: "Submitter",
    adminFieldModerationStatus: "AI moderation status",
    adminFieldModerationReason: "AI moderation reason",
    adminFieldNeighborhoodId: "Canonical neighborhood (ID)",
    adminFieldUpvotes: "Upvotes",
    adminFieldDownvotes: "Downvotes",
    adminTimelineAddEvent: "Add system event",
    adminTimelineAddEventPlaceholder: "e.g. Manually emailed municipality...",
    adminAiMediatorTitle: "AI mediator test bench",
    adminAiMediatorDescription:
      "Paste a sample municipality reply and see whether the AI marks it as satisfactory.",
    adminMunicipalityResponse: "Municipality response",
    adminMunicipalityResponsePlaceholder:
      "Example: We will send an inspection team by 15 Jul 2026.",
    adminRunAiReview: "Run AI review",
    adminReviewing: "AI is reviewing...",
    adminReviewSatisfactory: "AI: response is satisfactory",
    adminReviewUnsatisfactory: "AI: response is not satisfactory",
    adminSuggestedFollowUp: "Internal admin note:",
    adminPlatformReplyTitle: "Platform reply to municipality",
    adminPlatformReplyNote:
      "This text is recorded during full simulation and can be sent as a follow-up email.",
    adminSimulateFlow: "Simulate full municipality flow",
    adminSimulating: "Simulating...",
    adminFlowSuccess:
      "Flow recorded: municipality response + AI review + platform reply + updated signal status.",
    adminMunicipalityFlowDescription:
      "Simulates an inbound municipality reply, AI review, and generates the platform's official reply back.",
    adminFlowStep1: "1. Records municipality response",
    adminFlowStep2: "2. AI mediator reviews the reply (in Bulgarian)",
    adminFlowStep3: "3. Generates and records platform reply to municipality",
    adminFlowStep4: "4. Updates status (Resolved / No Response)",
    adminNoSignals: "No signals available for management.",
    adminTestingTab: "Testing",
    adminTestingTitle: "Test Bench",
    adminTestingDescription:
      "Edit prompts, inspect input payloads, and run test cases. Cases and runs are stored in the database so another person can manage them safely.",
    adminTestingCases: "Test cases",
    adminTestingNew: "New test",
    adminTestingName: "Test name",
    adminTestingKind: "Kind",
    adminTestingSystemPrompt: "System prompt",
    adminTestingUserPayload: "User payload (JSON)",
    adminTestingSaveCase: "Save test case",
    adminTestingRun: "Run test",
    adminTestingRunning: "Running...",
    adminTestingResult: "Result (parsed JSON)",
    adminTestingRuns: "Recent runs",
    adminCatalogTab: "Catalog",
    adminUsersTab: "Admins",
    adminCatalogNeighborhoodsTitle: "Neighborhoods",
    adminCatalogNeighborhoodsDescription: "For forms and filters.",
    adminCatalogNeighborhoodSelect: "Select neighborhood",
    adminCatalogSeedNeighborhoods: "Import",
    adminCatalogNameBg: "Name (BG)",
    adminCatalogNameEn: "Name (EN)",
    adminCatalogAliases: "Aliases",
    adminCatalogNew: "New entry",
    adminCatalogDelete: "Delete",
    adminCatalogPromptsTitle: "AI prompts",
    adminCatalogPromptsDescription: "Edit system prompts used by moderation and the AI mediator.",
    adminCatalogPromptDescription: "Description",
    adminCatalogSeeded: "Neighborhoods imported.",
    adminUsersTitle: "Admin users",
    adminUsersDescription: "Grant/revoke admin portal access via Supabase Auth email.",
    adminUsersDisplayName: "Display name",
    adminUsersAdd: "Add admin",
    adminUsersRemove: "Remove",
    adminUsersAdded: "Admin user added.",
    adminSignalCreate: "New signal",
    adminSignalDelete: "Delete signal",
    adminSignalCreated: "Signal created.",
    adminSignalDeleted: "Signal deleted.",
    adminEventDelete: "Delete",
    adminAttachmentsTitle: "Attachments",
    adminAttachmentsDescription: "Upload and remove images or documents for this signal.",
    adminAttachmentUpload: "Upload file",
    adminAttachmentUploading: "Uploading...",
    adminAttachmentDelete: "Delete file",
    adminCatalogEmailsTitle: "Email templates",
    adminCatalogEmailsDescription: "Templates for outbound municipality communication.",
    adminEmailTemplateSubject: "Subject",
    adminEmailTemplateBody: "Body",
    adminEmailTemplateRecipient: "Recipient (default)",
    adminEmailTemplateActive: "Active",
    adminEmailTemplatePreview: "Preview",
    adminEmailTemplateVariables:
      "Variables: {{signal_title}}, {{signal_description}}, {{district}}, {{signal_id}}, {{municipality_response}}, {{public_url}}",
    adminEmailTemplateSendTest: "Send test email",
    adminEmailTestSent: "Test email sent.",
    adminEmailPreviewSubject: "Subject preview",
    adminEmailPreviewBody: "Body preview",
    adminFlowsTab: "Flows",
    adminFlowsTitle: "Process diagrams",
    adminFlowsDescription:
      "Visual arrow diagram: what happens on submission, municipality reply, and public engagement. Reorder steps with ↑/↓.",
    adminFlowsSeedDefaults: "Restore default flows",
    adminFlowsLegend: "Process participants",
    adminFlowsDiagram: "Step diagram",
    adminFlowsStepTitle: "Step title",
    adminFlowsStepDescription: "Explanation",
    adminFlowsMoveUp: "Move up",
    adminFlowsMoveDown: "Move down",
    adminFlowsSaveOrder: "Save order and text",
    adminFlowsEmpty: "No flows configured. Click “Restore default flows”.",
    adminFlowsSeeded: "Default flows loaded.",
    adminFlowsSeeDiagram:
      "The full process diagram is under Settings → Flows.",
    adminSettingsNav: "Platform settings",
    adminWorkbenchNav: "Workbench mode",
    adminWorkbenchMunicipality: "Municipality reply",
    adminWorkbenchPrompts: "AI tests",
    adminWorkbenchMunicipalityTitle: "Test and simulate municipality reply",
    adminWorkbenchSelectSignal:
      "Select a signal from the list on the left to test replies or AI prompts.",
  },
};

export const statusLabels: Record<Locale, Record<SignalStatus, string>> = {
  bg: {
    Resolved: "Решен",
    Pending: "В изчакване",
    "No Response": "Няма отговор",
  },
  en: {
    Resolved: "Resolved",
    Pending: "Pending",
    "No Response": "No Response",
  },
};

export const themeLabels: Record<Locale, Record<Theme, string>> = {
  bg: {
    dark: "Тъмна",
    light: "Светла",
  },
  en: {
    dark: "Dark",
    light: "Light",
  },
};
