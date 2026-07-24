import { useEffect, useState } from "react";
import type { AppTranslations } from "../../i18n";
import {
  addAdminProfile,
  listAdminProfiles,
  removeAdminProfile,
  type AdminProfileRow,
} from "../../lib/adminApi";

interface AdminUsersPanelProps {
  text: AppTranslations;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function AdminUsersPanel({ text, onNotice, onError }: AdminUsersPanelProps) {
  const [admins, setAdmins] = useState<AdminProfileRow[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadAdmins = async () => {
    const nextAdmins = await listAdminProfiles();
    setAdmins(nextAdmins);
  };

  useEffect(() => {
    void loadAdmins().catch((error: unknown) => {
      onError(error instanceof Error ? error.message : text.adminError);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await addAdminProfile(email.trim(), displayName.trim() || undefined);
      setEmail("");
      setDisplayName("");
      await loadAdmins();
      onNotice(text.adminUsersAdded);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setIsSaving(true);
    try {
      await removeAdminProfile(userId);
      await loadAdmins();
      onNotice(text.adminSaved);
    } catch (error) {
      onError(error instanceof Error ? error.message : text.adminError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card admin-editor">
      <div className="section-header">
        <h3>{text.adminUsersTitle}</h3>
        <p>{text.adminUsersDescription}</p>
      </div>

      <form className="signal-form admin-editor-form" onSubmit={handleAdd}>
        <label>
          {text.adminEmail}
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          {text.adminUsersDisplayName}
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <button type="submit" disabled={isSaving}>
          {isSaving ? text.adminSaving : text.adminUsersAdd}
        </button>
      </form>

      <ul className="admin-users-list">
        {admins.map((admin) => (
          <li key={admin.user_id} className="admin-user-row">
            <div>
              <strong>{admin.display_name ?? admin.user_id}</strong>
              <span>{admin.user_id}</span>
            </div>
            <button
              type="button"
              className="vote-btn secondary"
              disabled={isSaving}
              onClick={() => void handleRemove(admin.user_id)}
            >
              {text.adminUsersRemove}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
