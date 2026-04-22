import type { AppTranslations, Locale } from "../i18n";
import type { Signal } from "../types";

interface SignalModalProps {
  signal: Signal;
  text: AppTranslations;
  locale: Locale;
  statusLabel: (status: Signal["status"]) => string;
  priorityLabel: (priority: Signal["priority"]) => string;
  onClose: () => void;
  onVote: (signalId: string, voteType: "up" | "down") => Promise<void>;
}

export function SignalModal({
  signal,
  text,
  locale,
  statusLabel,
  priorityLabel,
  onClose,
  onVote,
}: SignalModalProps) {
  const formatter = new Intl.DateTimeFormat(locale === "bg" ? "bg-BG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const timelineLabelByType = {
    original_signal: text.communicationEventOriginalSignal,
    ai_summary: text.communicationEventAiSummary,
    submitted_to_municipality: text.communicationEventSubmittedToMunicipality,
    municipality_response: text.communicationEventMunicipalityResponse,
    ai_response_review: text.communicationEventAiResponseReview,
  } as const;

  const timelineEvents = [...signal.communicationTimeline].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
  const hasMunicipalityResponse = timelineEvents.some(
    (event) => event.eventType === "municipality_response"
  );

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={signal.title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <h2>{signal.title}</h2>
          <button type="button" onClick={onClose}>
            {text.closeDetails}
          </button>
        </header>

        <div className="modal-meta">
          <span>
            <strong>{text.modalDistrict}:</strong> {signal.district}
          </span>
          <span>
            <strong>{text.modalStatus}:</strong> {statusLabel(signal.status)}
          </span>
          <span>
            <strong>{text.modalPriority}:</strong> {priorityLabel(signal.priority)}
          </span>
          <span>{formatter.format(new Date(signal.createdAt))}</span>
        </div>

        <p className="modal-summary">{signal.summary}</p>

        <section className="modal-timeline">
          <h3>{text.communicationTitle}</h3>
          <ol>
            {timelineEvents.map((event) => (
              <li key={event.id} className={`timeline-${event.actor}`}>
                <div className="timeline-head">
                  <strong>{timelineLabelByType[event.eventType]}</strong>
                  <time dateTime={event.createdAt}>
                    {formatter.format(new Date(event.createdAt))}
                  </time>
                </div>
                <p>{event.message}</p>
                {event.eventType === "ai_response_review" &&
                typeof event.satisfactory === "boolean" ? (
                  <span
                    className={event.satisfactory ? "timeline-badge ok" : "timeline-badge warn"}
                  >
                    {event.satisfactory
                      ? text.communicationSatisfactory
                      : text.communicationUnsatisfactory}
                  </span>
                ) : null}
              </li>
            ))}
            {!hasMunicipalityResponse ? (
              <li className="timeline-placeholder">
                <div className="timeline-head">
                  <strong>{text.communicationEventMunicipalityResponse}</strong>
                </div>
                <p>{text.communicationNoResponseYet}</p>
              </li>
            ) : null}
          </ol>
        </section>

        {signal.attachments.length > 0 ? (
          <div className="modal-gallery">
            {signal.attachments
              .filter((item) => item.mimeType.startsWith("image/"))
              .map((item) => (
                <a key={item.id} href={item.publicUrl} target="_blank" rel="noreferrer">
                  <img src={item.publicUrl} alt={item.fileName} />
                </a>
              ))}
          </div>
        ) : null}

        <footer className="modal-actions">
          <button type="button" className="vote-btn" onClick={() => void onVote(signal.id, "up")}>
            {text.voteUp} (+{signal.upvotes})
          </button>
          <button
            type="button"
            className="vote-btn secondary"
            onClick={() => void onVote(signal.id, "down")}
          >
            {text.voteDown} ({signal.downvotes})
          </button>
          <p>
            {text.votesScore}: <strong>{signal.upvotes - signal.downvotes}</strong>
          </p>
        </footer>
      </section>
    </div>
  );
}
