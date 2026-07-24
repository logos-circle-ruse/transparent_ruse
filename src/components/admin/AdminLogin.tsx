import { useState } from "react";
import type { AppTranslations } from "../../i18n";
import { signInAdmin } from "../../lib/adminAuth";

interface AdminLoginProps {
  text: AppTranslations;
  onSignedIn: () => void;
}

export function AdminLogin({ text, onSignedIn }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInAdmin(email.trim(), password);
      onSignedIn();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : text.adminLoginError;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card admin-login-card">
      <div className="section-header">
        <h2>{text.adminLoginTitle}</h2>
        <p>{text.adminLoginDescription}</p>
      </div>

      <form className="signal-form admin-login-form" onSubmit={handleSubmit}>
        <label>
          {text.adminEmail}
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          {text.adminPassword}
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className="banner-warning">{error}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? text.adminSigningIn : text.adminSignIn}
        </button>
      </form>
    </section>
  );
}
