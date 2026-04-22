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
  formSuccess: string;
  formErrorPrefix: string;
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
      "Всеки сигнал минава през анти-спам и AI модерация преди публикуване.",
    formSubmit: "Изпрати сигнал",
    formSubmitting: "Изпращане...",
    formSuccess: "Сигналът е изпратен успешно.",
    formErrorPrefix: "Неуспешно изпращане",
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
      "Each submission goes through anti-spam checks and AI moderation.",
    formSubmit: "Submit Signal",
    formSubmitting: "Submitting...",
    formSuccess: "Signal submitted successfully.",
    formErrorPrefix: "Submission failed",
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
