import "./App.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCanonicalNeighborhoodId,
  normalizeNeighborhoodKey,
} from "./data/ruseNeighborhoods";
import { NeighborhoodMapCard } from "./components/NeighborhoodMapCard";
import { SignalList } from "./components/SignalList";
import { SignalModal } from "./components/SignalModal";
import { SignalForm } from "./components/SignalForm";
import { StatusPieChart } from "./components/StatusPieChart";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPortal } from "./components/admin/AdminPortal";
import { useAdminAuth } from "./hooks/useAdminAuth";
import {
  statusLabels,
  translations,
  themeLabels,
  type AppTranslations,
  type Locale,
  type Theme,
} from "./i18n";
import { fetchSignals } from "./lib/signals";
import { voteSignal } from "./lib/vote";
import type { Signal, SignalPriority } from "./types";

const PRIORITY_ORDER: Record<SignalPriority, number> = {
  Critical: 3,
  High: 2,
  Normal: 1,
};

function getPriorityLabel(priority: SignalPriority, text: AppTranslations) {
  if (priority === "Critical") return text.priorityCritical;
  if (priority === "High") return text.priorityHigh;
  return text.priorityNormal;
}

function toNeighborhoodSlug(value: string | null | undefined) {
  if (!value) return "";
  return normalizeNeighborhoodKey(value).replace(/\s+/g, "-");
}

function App() {
  const [locale, setLocale] = useState<Locale>("bg");
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem("transparent-ruse-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  });
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<"dashboard" | "submit" | "admin">(() => {
    if (window.location.hash === "#admin") {
      return "admin";
    }
    return "dashboard";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<"all" | SignalPriority>("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all");
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const selectedSignal = useMemo(
    () => signals.find((s) => s.id === selectedSignalId) ?? null,
    [signals, selectedSignalId]
  );
  const [voteNotice, setVoteNotice] = useState<string | null>(null);
  const { isAuthenticated: isAdminAuthenticated, isLoading: isAdminAuthLoading } = useAdminAuth();

  useEffect(() => {
    const syncAdminRoute = () => {
      if (window.location.hash === "#admin") {
        setActivePage("admin");
      }
    };

    window.addEventListener("hashchange", syncAdminRoute);
    return () => window.removeEventListener("hashchange", syncAdminRoute);
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("transparent-ruse-theme", theme);
  }, [theme]);

  const refreshSignals = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchSignals();
    setSignals(result.signals);
    setIsFallback(result.isFallback);
    setLoadError(result.error ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshSignals();
  }, [refreshSignals]);

  const text = translations[locale];
  const labelByStatus = useMemo(() => statusLabels[locale], [locale]);
  const visibleSignals = useMemo(() => {
    const byPriority =
      priorityFilter === "all"
        ? signals
        : signals.filter((signal) => signal.priority === priorityFilter);

    const byNeighborhood =
      neighborhoodFilter === "all"
        ? byPriority
        : byPriority.filter((signal) => {
            const rawNeighborhood = signal.neighborhoodId ?? signal.district ?? "";
            const canonicalNeighborhoodId = getCanonicalNeighborhoodId(rawNeighborhood) ?? "";
            const normalizedNeighborhoodSlug = toNeighborhoodSlug(rawNeighborhood);
            return (
              canonicalNeighborhoodId === neighborhoodFilter ||
              normalizedNeighborhoodSlug === neighborhoodFilter
            );
          });

    return [...byNeighborhood].sort((left, right) => {
      const priorityDiff = PRIORITY_ORDER[right.priority] - PRIORITY_ORDER[left.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return right.upvotes - right.downvotes - (left.upvotes - left.downvotes);
    });
  }, [neighborhoodFilter, priorityFilter, signals]);

  const pendingCount = signals.filter((signal) => signal.status === "Pending").length;
  const criticalCount = signals.filter((signal) => signal.priority === "Critical").length;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const leaveAdminPortal = () => {
    if (window.location.hash === "#admin") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setActivePage("dashboard");
    closeMobileMenu();
  };

  const handleVote = async (signalId: string, voteType: "up" | "down") => {
    try {
    const updatedSignal = await voteSignal(signalId, voteType);
    if (updatedSignal) {
      setSignals((current) =>
        current.map((signal) =>
          signal.id !== signalId
            ? signal
            : {
                ...signal,
                upvotes: updatedSignal.upvotes,
                downvotes: updatedSignal.downvotes,
                priority: updatedSignal.priority as SignalPriority,
              }
        )
      );
    }

    setVoteNotice(text.voteSuccess);
  } catch {
    setVoteNotice(text.voteError);
  }
};

  return (
    <div className="app">
      <header className="hero">
        <div className="top-nav">
          <button
            type="button"
            className="brand-mark-btn"
            onClick={() => {
              setActivePage("dashboard");
              closeMobileMenu();
            }}
            aria-label={text.menuDashboard}
          >
            <span className="brand-mark">TR.</span>
          </button>
          <button
            type="button"
            className={isMobileMenuOpen ? "hamburger-btn open" : "hamburger-btn"}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? text.menuClose : text.menuOpen}
          >
            <span className={isMobileMenuOpen ? "hamburger-icon open" : "hamburger-icon"}>
              <span />
              <span />
              <span />
            </span>
          </button>
          <div className={isMobileMenuOpen ? "menu-shell open" : "menu-shell"}>
            <nav className="menu-tabs" aria-label="Main menu">
              <button
                type="button"
                className={activePage === "dashboard" ? "menu-tab active" : "menu-tab"}
                onClick={() => {
                  setActivePage("dashboard");
                  closeMobileMenu();
                }}
              >
                {text.menuDashboard}
              </button>
              <button
                type="button"
                className={activePage === "submit" ? "menu-tab active" : "menu-tab"}
                onClick={() => {
                  setActivePage("submit");
                  closeMobileMenu();
                }}
              >
                {text.menuSubmit}
              </button>
            </nav>

            <div className="top-controls">
              <div className="control-group segmented language-group">
                <span>{text.languageLabel}</span>
                <div className="segmented-buttons">
                  <button
                    type="button"
                    className={locale === "bg" ? "seg-btn active" : "seg-btn"}
                    onClick={() => setLocale("bg")}
                  >
                    BG
                  </button>
                  <button
                    type="button"
                    className={locale === "en" ? "seg-btn active" : "seg-btn"}
                    onClick={() => setLocale("en")}
                  >
                    EN
                  </button>
                </div>
              </div>

              <div className="control-group">
                <span>{text.themeLabel}</span>
                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                  aria-label={theme === "dark" ? themeLabels[locale].light : themeLabels[locale].dark}
                  title={theme === "dark" ? themeLabels[locale].light : themeLabels[locale].dark}
                >
                  {theme === "dark" ? (
                    <svg
                      className="theme-toggle-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                    </svg>
                  ) : (
                    <svg
                      className="theme-toggle-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2.2M12 19.8V22M4.22 4.22 5.8 5.8M18.2 18.2l1.58 1.58M2 12h2.2M19.8 12H22M4.22 19.78 5.8 18.2M18.2 5.8l1.58-1.58" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.heroTitle}</h1>
        <p>{activePage === "dashboard" ? text.heroDescription : activePage === "submit" ? text.heroSubmitDescription : text.adminSubtitle}</p>
        {activePage === "dashboard" ? (
          <section className="stats-cta">
            <h2>{text.statsCtaTitle}</h2>
            <p>{text.statsCtaDescription}</p>
            <div className="stats-row">
              <article>
                <strong>{signals.length}</strong>
                <span>{text.statsSignals}</span>
              </article>
              <article>
                <strong>{pendingCount}</strong>
                <span>{text.statsPending}</span>
              </article>
              <article>
                <strong>{criticalCount}</strong>
                <span>{text.statsCritical}</span>
              </article>
              <button type="button" onClick={() => setActivePage("submit")}>
                {text.statsCtaButton}
              </button>
            </div>
          </section>
        ) : null}
        {isLoading ? <p className="banner-info">{text.loading}</p> : null}
        {!isLoading && isFallback ? (
          <p className="banner-warning">{text.fallbackNotice}</p>
        ) : null}
        {!isLoading && loadError ? (
          <p className="banner-warning">
            {text.errorPrefix}: {loadError}
          </p>
        ) : null}
      </header>

      {activePage === "dashboard" ? (
        <main className="content-grid">
          <NeighborhoodMapCard
            signals={signals}
            locale={locale}
            text={text}
            neighborhoodFilter={neighborhoodFilter}
            onNeighborhoodFilterChange={setNeighborhoodFilter}
          />
          <StatusPieChart
            signals={visibleSignals}
            title={text.overviewTitle}
            description={text.overviewDescription}
            locale={locale}
            statusLabel={(status) => labelByStatus[status]}
          />
          <SignalList
            signals={visibleSignals}
            title={text.signalsTitle}
            description={text.signalsDescription}
            locale={locale}
            noSignalsText={text.noSignals}
            attachmentsTitle={text.attachmentsGallery}
            openDetailsText={text.openDetails}
            statusLabel={(status) => labelByStatus[status]}
            priorityLabel={(priority) => getPriorityLabel(priority, text)}
            priorityFilter={priorityFilter}
            priorityFilterLabel={text.menuPriority}
            priorityAllLabel={text.priorityAll}
            priorityCriticalLabel={text.priorityCritical}
            priorityHighLabel={text.priorityHigh}
            priorityNormalLabel={text.priorityNormal}
            onPriorityFilterChange={setPriorityFilter}
            onOpenSignal={(signal) => setSelectedSignalId(signal.id)}
          />
        </main>
      ) : activePage === "submit" ? (
        <main className="submit-grid">
          <SignalForm text={text} locale={locale} onSubmitted={refreshSignals} />
        </main>
      ) : isAdminAuthLoading ? (
        <main className="admin-grid">
          <p className="banner-info">{text.adminLoading}</p>
        </main>
      ) : isAdminAuthenticated ? (
        <AdminPortal
          text={text}
          locale={locale}
          onBackToPublic={leaveAdminPortal}
          onSignalsChanged={refreshSignals}
        />
      ) : (
        <main className="admin-grid">
          <AdminLogin
            text={text}
            onSignedIn={() => {
              window.location.hash = "#admin";
              setActivePage("admin");
            }}
          />
        </main>
      )}
      {voteNotice ? <p className="banner-info floating-banner">{voteNotice}</p> : null}
      {selectedSignal ? (
        <SignalModal
          signal={selectedSignal}
          text={text}
          locale={locale}
          statusLabel={(status) => labelByStatus[status]}
          priorityLabel={(priority) => getPriorityLabel(priority, text)}
          onVote={handleVote}
          onClose={() => setSelectedSignalId(null)}

        />
      ) : null}
    </div>
  );
}

export default App;
