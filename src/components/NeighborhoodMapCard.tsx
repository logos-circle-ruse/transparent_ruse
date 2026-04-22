import { useMemo, useState, type MouseEvent } from "react";
import type { AppTranslations, Locale } from "../i18n";
import {
  getCanonicalNeighborhoodId,
  normalizeNeighborhoodKey,
  ruseNeighborhoods,
} from "../data/ruseNeighborhoods";
import ruseNeighborhoodsSvgRaw from "../assets/ruse-neighborhoods.svg?raw";
import ruseNeighborhoodsSvgUrl from "../assets/ruse-neighborhoods.svg";
import type { Signal } from "../types";

interface NeighborhoodMapCardProps {
  signals: Signal[];
  locale: Locale;
  text: AppTranslations;
  neighborhoodFilter: string;
  onNeighborhoodFilterChange: (value: string) => void;
}

const STATUS_COLOR: Record<Signal["status"] | "none", string> = {
  Resolved: "#1f8f4f",
  Pending: "#d49a00",
  "No Response": "#a01f44",
  none: "#58708e",
};

const NEIGHBORHOOD_LIST_COLLAPSED_COUNT = 5;

function toNeighborhoodSlug(value: string | null | undefined) {
  if (!value) return "";
  return normalizeNeighborhoodKey(value).replace(/\s+/g, "-");
}

export function NeighborhoodMapCard({
  signals,
  locale,
  text,
  neighborhoodFilter,
  onNeighborhoodFilterChange,
}: NeighborhoodMapCardProps) {
  const [isNeighborhoodListExpanded, setIsNeighborhoodListExpanded] = useState(false);

  const statusLabelByLocale: Record<Locale, Record<Signal["status"], string>> = {
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

  const canonicalNameById = useMemo(
    () =>
      new Map(
        ruseNeighborhoods.map((item) => [
          item.id,
          locale === "bg" ? item.nameBg : item.nameEn,
        ])
      ),
    [locale]
  );

  const mapAreas = useMemo(() => {
    const areaById = new Map<string, string>();

    ruseNeighborhoods.forEach((item) => {
      areaById.set(item.id, locale === "bg" ? item.nameBg : item.nameEn);
    });

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(ruseNeighborhoodsSvgRaw, "image/svg+xml");
      if (doc.querySelector("parsererror")) {
        return Array.from(areaById, ([id, name]) => ({ id, name }));
      }

      const paths = Array.from(doc.querySelectorAll("path"));
      paths.forEach((path) => {
        const rawTitle = path.querySelector("title")?.textContent?.trim() ?? "";
        if (!rawTitle) {
          return;
        }

        const canonicalId = getCanonicalNeighborhoodId(rawTitle);
        const areaId = canonicalId ?? toNeighborhoodSlug(rawTitle);
        if (!areaId) {
          return;
        }

        areaById.set(areaId, canonicalNameById.get(areaId) ?? rawTitle);
      });
    } catch {
      return Array.from(areaById, ([id, name]) => ({ id, name }));
    }

    return Array.from(areaById, ([id, name]) => ({ id, name }));
  }, [canonicalNameById, locale]);

  const stats = useMemo(
    () =>
      mapAreas
        .map((area) => {
          const neighborhoodSignals = signals.filter((signal) => {
            const rawNeighborhood = signal.neighborhoodId ?? signal.district ?? "";
            const canonicalNeighborhoodId = getCanonicalNeighborhoodId(rawNeighborhood) ?? "";
            const normalizedNeighborhoodSlug = toNeighborhoodSlug(rawNeighborhood);
            return (
              canonicalNeighborhoodId === area.id || normalizedNeighborhoodSlug === area.id
            );
          });

          const statusCount: Record<Signal["status"], number> = {
            Resolved: 0,
            Pending: 0,
            "No Response": 0,
          };
          neighborhoodSignals.forEach((signal) => {
            statusCount[signal.status] += 1;
          });

          let dominantStatus: Signal["status"] | "none" = "none";
          let maxCount = 0;
          (Object.keys(statusCount) as Signal["status"][]).forEach((status) => {
            if (statusCount[status] > maxCount) {
              maxCount = statusCount[status];
              dominantStatus = status;
            }
          });

          return {
            id: area.id,
            name: area.name,
            total: neighborhoodSignals.length,
            dominantStatus,
          };
        })
        .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name)),
    [mapAreas, signals]
  );

  const statsById = useMemo(
    () => new Map(stats.map((item) => [item.id, item])),
    [stats]
  );

  const mapSvgMarkup = useMemo(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(ruseNeighborhoodsSvgRaw, "image/svg+xml");
      if (doc.querySelector("parsererror")) {
        return null;
      }
      const paths = Array.from(doc.querySelectorAll("path"));

      paths.forEach((path) => {
        const rawTitle = path.querySelector("title")?.textContent?.trim() ?? "";
        const canonicalNeighborhoodId = getCanonicalNeighborhoodId(rawTitle);
        const neighborhoodId = canonicalNeighborhoodId ?? toNeighborhoodSlug(rawTitle);

        if (!neighborhoodId) {
          path.removeAttribute("data-neighborhood-id");
          path.setAttribute("fill", "rgba(88, 112, 142, 0.12)");
          path.setAttribute("stroke", "#2a4b77");
          path.setAttribute("stroke-width", "1");
          path.setAttribute("style", "cursor:default");
          return;
        }

        const stat = statsById.get(neighborhoodId);
        const dominantStatus = stat?.dominantStatus ?? "none";
        const total = stat?.total ?? 0;
        const selected = neighborhoodFilter === neighborhoodId;
        path.setAttribute("data-neighborhood-id", neighborhoodId);
        path.setAttribute("fill", STATUS_COLOR[dominantStatus]);
        path.setAttribute("fill-opacity", total > 0 ? "0.52" : "0.2");
        path.setAttribute("stroke", selected ? "#8dd8ff" : "#2a4b77");
        path.setAttribute("stroke-width", selected ? "2.8" : "1.5");
        path.setAttribute("style", "cursor:pointer");
      });

      return new XMLSerializer().serializeToString(doc.documentElement);
    } catch {
      return null;
    }
  }, [neighborhoodFilter, statsById]);

  const visibleNeighborhoodStats = isNeighborhoodListExpanded
    ? stats
    : stats.slice(0, NEIGHBORHOOD_LIST_COLLAPSED_COUNT);

  const onMapClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as Element | null;
    const area = target?.closest("path[data-neighborhood-id]");
    if (!area) {
      return;
    }
    const id = area.getAttribute("data-neighborhood-id");
    if (!id) {
      return;
    }
    onNeighborhoodFilterChange(neighborhoodFilter === id ? "all" : id);
  };

  return (
    <section className="card map-card">
      <header className="section-header">
        <div className="section-header-row">
          <div>
            <h2>{text.mapTitle}</h2>
            <p>{text.mapDescription}</p>
          </div>
          <label className="priority-control">
            <span>{text.neighborhoodFilter}</span>
            <select
              value={neighborhoodFilter}
              onChange={(event) => onNeighborhoodFilterChange(event.target.value)}
            >
              <option value="all">{text.neighborhoodAll}</option>
              {stats.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="map-layout">
        <div className="map-container svg-map-wrap" onClick={onMapClick}>
          {mapSvgMarkup ? (
            <div
              className="svg-map"
              dangerouslySetInnerHTML={{ __html: mapSvgMarkup }}
            />
          ) : (
            <img
              className="svg-map-fallback"
              src={ruseNeighborhoodsSvgUrl}
              alt={text.mapTitle}
            />
          )}
        </div>

        <aside className="map-stats">
          <h3>{text.neighborhoodStats}</h3>
          <p className="map-hint">{text.mapClickHint}</p>
          <div className="map-legend">
            <p>{text.mapLegendTitle}</p>
            <ul>
              <li>
                <span style={{ background: STATUS_COLOR.Pending }} />
                {statusLabelByLocale[locale].Pending}
              </li>
              <li>
                <span style={{ background: STATUS_COLOR["No Response"] }} />
                {statusLabelByLocale[locale]["No Response"]}
              </li>
              <li>
                <span style={{ background: STATUS_COLOR.Resolved }} />
                {statusLabelByLocale[locale].Resolved}
              </li>
              <li>
                <span style={{ background: STATUS_COLOR.none }} />
                {text.mapNoSignals}
              </li>
            </ul>
          </div>
          <ul>
            {visibleNeighborhoodStats.map((item) => (
              <li
                key={item.id}
                className={neighborhoodFilter === item.id ? "active" : ""}
                onClick={() =>
                  onNeighborhoodFilterChange(
                    neighborhoodFilter === item.id ? "all" : item.id
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onNeighborhoodFilterChange(
                      neighborhoodFilter === item.id ? "all" : item.id
                    );
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span>{item.name}</span>
                <strong>
                  {item.total} {text.neighborhoodSignals}
                </strong>
              </li>
            ))}
          </ul>
          {stats.length > NEIGHBORHOOD_LIST_COLLAPSED_COUNT ? (
            <button
              type="button"
              className="map-expand-btn"
              onClick={() =>
                setIsNeighborhoodListExpanded((current) => !current)
              }
            >
              {isNeighborhoodListExpanded
                ? text.mapSeeLessNeighborhoods
                : text.mapSeeAllNeighborhoods}
            </button>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
