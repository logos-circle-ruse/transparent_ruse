import { statusLabels, type AppTranslations, type Locale } from "../../i18n";
import type { AdminSignal } from "../../types";

interface AdminSignalContextProps {
  signal: AdminSignal;
  text: AppTranslations;
  locale: Locale;
}

export function AdminSignalContext({ signal, text, locale }: AdminSignalContextProps) {
  const statusLabel = statusLabels[locale];
  const recentEvents = signal.communicationTimeline.slice(-4);

  return (
    <article className="admin-signal-context card">
      <div className="admin-signal-context-head">
        <div>
          <h3>{signal.title}</h3>
          <p className="admin-signal-context-meta">
            {statusLabel[signal.status]} · {signal.district} · {signal.priority}
          </p>
        </div>
        <span className="admin-signal-context-id">{signal.id.slice(0, 8)}…</span>
      </div>

      <p className="admin-signal-context-description">{signal.description}</p>

      {signal.attachments.length > 0 ? (
        <p className="admin-signal-context-meta">
          {text.attachmentsGallery}: {signal.attachments.length}
        </p>
      ) : null}

      {recentEvents.length > 0 ? (
        <details className="admin-signal-context-timeline">
          <summary>{text.communicationTitle}</summary>
          <ul>
            {recentEvents.map((event) => (
              <li key={event.id} className={`timeline-${event.actor}`}>
                <strong>{event.eventType}</strong>
                <p>{event.message}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}
