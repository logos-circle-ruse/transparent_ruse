import type { Signal, SignalPriority } from "../types";
import type { Locale } from "../i18n";

interface SignalListProps {
  signals: Signal[];
  title: string;
  description: string;
  locale: Locale;
  noSignalsText: string;
  attachmentsTitle: string;
  statusLabel: (status: Signal["status"]) => string;
  priorityLabel: (priority: Signal["priority"]) => string;
  priorityFilter: "all" | SignalPriority;
  priorityFilterLabel: string;
  priorityAllLabel: string;
  priorityCriticalLabel: string;
  priorityHighLabel: string;
  priorityNormalLabel: string;
  onPriorityFilterChange: (value: "all" | SignalPriority) => void;
  openDetailsText: string;
  onOpenSignal: (signal: Signal) => void;
}

export function SignalList({
  signals,
  title,
  description,
  locale,
  noSignalsText,
  attachmentsTitle,
  statusLabel,
  priorityLabel,
  priorityFilter,
  priorityFilterLabel,
  priorityAllLabel,
  priorityCriticalLabel,
  priorityHighLabel,
  priorityNormalLabel,
  onPriorityFilterChange,
  openDetailsText,
  onOpenSignal,
}: SignalListProps) {
  const formatter = new Intl.DateTimeFormat(locale === "bg" ? "bg-BG" : "en-US", {
    dateStyle: "medium",
  });

  return (
    <section className="card">
      <header className="section-header">
        <div className="section-header-row">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <label className="priority-control">
            <span>{priorityFilterLabel}</span>
            <select
              value={priorityFilter}
              onChange={(event) =>
                onPriorityFilterChange(event.target.value as "all" | SignalPriority)
              }
            >
              <option value="all">{priorityAllLabel}</option>
              <option value="Critical">{priorityCriticalLabel}</option>
              <option value="High">{priorityHighLabel}</option>
              <option value="Normal">{priorityNormalLabel}</option>
            </select>
          </label>
        </div>
      </header>

      <div className="signal-list">
        {signals.length === 0 ? <p className="empty-state">{noSignalsText}</p> : null}
        {signals.map((signal) => (
          <article
            className="signal-item clickable"
            key={signal.id}
            onClick={() => onOpenSignal(signal)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenSignal(signal);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="signal-meta">
              <span className="signal-id">{signal.id}</span>
              <span
                className={`status-pill status-${signal.status.toLowerCase().replace(" ", "-")}`}
              >
                {statusLabel(signal.status)}
              </span>
            </div>
            <div className="signal-meta secondary">
              <span className={`priority-pill priority-${signal.priority.toLowerCase()}`}>
                {priorityLabel(signal.priority)}
              </span>
              <span className="signal-score">{signal.upvotes - signal.downvotes}</span>
            </div>
            <h3>{signal.title}</h3>
            <p>{signal.summary}</p>
            {signal.attachments.length > 0 ? (
              <section className="signal-attachments">
                <h4>{attachmentsTitle}</h4>

                <div className="signal-gallery">
                  {signal.attachments
                    .filter((attachment) => attachment.mimeType.startsWith("image/"))
                    .slice(0, 4)
                    .map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img src={attachment.publicUrl} alt={attachment.fileName} />
                      </a>
                    ))}
                </div>

                <ul className="signal-files">
                  {signal.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a href={attachment.publicUrl} target="_blank" rel="noreferrer">
                        {attachment.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <footer>
              <span>{signal.district}</span>
              <time dateTime={signal.createdAt}>
                {formatter.format(new Date(signal.createdAt))}
              </time>
            </footer>
            <button
              type="button"
              className="open-details-btn"
              onClick={(event) => {
                event.stopPropagation();
                onOpenSignal(signal);
              }}
            >
              {openDetailsText}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
