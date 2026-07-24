import type { AppTranslations, Locale } from "../../i18n";
import { AdminCatalogPanel } from "./AdminCatalogPanel";
import { AdminFlowsPanel } from "./AdminFlowsPanel";
import { AdminUsersPanel } from "./AdminUsersPanel";

export type SettingsSection = "catalog" | "flows" | "users";

interface AdminSettingsPanelProps {
  text: AppTranslations;
  locale: Locale;
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function AdminSettingsPanel({
  text,
  locale,
  section,
  onSectionChange,
  onNotice,
  onError,
}: AdminSettingsPanelProps) {
  return (
    <div className="admin-settings-panel">
      <nav className="admin-subtabs" aria-label={text.adminSettingsNav}>
        <button
          type="button"
          className={section === "catalog" ? "admin-subtab active" : "admin-subtab"}
          onClick={() => onSectionChange("catalog")}
        >
          {text.adminCatalogTab}
        </button>
        <button
          type="button"
          className={section === "flows" ? "admin-subtab active" : "admin-subtab"}
          onClick={() => onSectionChange("flows")}
        >
          {text.adminFlowsTab}
        </button>
        <button
          type="button"
          className={section === "users" ? "admin-subtab active" : "admin-subtab"}
          onClick={() => onSectionChange("users")}
        >
          {text.adminUsersTab}
        </button>
      </nav>

      {section === "catalog" ? (
        <AdminCatalogPanel text={text} onNotice={onNotice} onError={onError} />
      ) : null}

      {section === "flows" ? (
        <AdminFlowsPanel text={text} locale={locale} onNotice={onNotice} onError={onError} />
      ) : null}

      {section === "users" ? (
        <AdminUsersPanel text={text} onNotice={onNotice} onError={onError} />
      ) : null}
    </div>
  );
}
