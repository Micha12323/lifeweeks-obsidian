import { useState } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { dayDates, localIso, weekKey } from "../core/dates";
import type { LegendState, TabWeeks } from "../core/types";
import type { DailyIdx } from "../data/DailyIndex";
import { displayWeekLabel, t, weekdayLabel } from "../i18n";
import { Palette } from "./Palette";

/**
 * Long-Press auf eine Zelle → Tagesansicht der Woche (Mo–So).
 * Klick auf einen Tag öffnet/erzeugt die Tagesnotiz in "Daily basis/"
 * im nativen Obsidian-Editor (Anbindung an die täglichen Notizen).
 * Unten: Farbe/Titel der Wochennotiz (wie im Quick-Edit) + öffnen/anlegen.
 * Portal in document.body wegen contain:strict der Obsidian-Leaves.
 */
export function DayPanel({
  n,
  birthDate,
  weeksData,
  dailyIdx,
  legend,
  onOpenDay,
  onOpenWeek,
  onWeekColor,
  onWeekTitle,
  onClose,
}: {
  n: number;
  birthDate: string;
  weeksData: TabWeeks;
  dailyIdx: DailyIdx;
  legend: LegendState;
  /** background=true: Rechts-/Mittelklick → Hintergrund-Tab, Panel bleibt offen */
  onOpenDay: (iso: string, background?: boolean) => void;
  onOpenWeek: (n: number, background?: boolean) => void;
  onWeekColor: (n: number, color: string | null) => void;
  onWeekTitle: (n: number, title: string) => void;
  onClose: () => void;
}) {
  const days = dayDates(birthDate, n);
  const lb = displayWeekLabel(birthDate, n);
  const todayIso = localIso(new Date());
  const week = weeksData[weekKey(birthDate, n)];
  const [title, setTitle] = useState(week?.title ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const commitTitle = () => {
    const tt = title.trim();
    if (tt !== (week?.title ?? "")) onWeekTitle(n, tt);
  };

  return createPortal(
    <div className="lw-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lw-modal lw-day-panel">
        <div className="lw-qe-head">
          <div>
            <div className="lw-qe-life">{lb.life}</div>
            <div className="lw-qe-dates">{lb.dates}</div>
          </div>
          <button className="lw-qe-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="lw-day-list">
          {days.map((d) => {
            const entry = dailyIdx[d.iso];
            const isToday = d.iso === todayIso;
            return (
              <button
                key={d.iso}
                className={`lw-day-row ${isToday ? "today" : ""}`}
                onClick={() => onOpenDay(d.iso)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenDay(d.iso, true);
                }}
                onAuxClick={(e) => e.button === 1 && onOpenDay(d.iso, true)}
                title={`${entry ? t("dayOpenTitle") : t("dayCreateTitle")} – ${t("bgHint")}`}
              >
                <span className="lw-day-dot" style={{ background: entry?.color ?? "transparent" }} />
                <span className="lw-day-label">{weekdayLabel(d.date)}</span>
                <span className="lw-day-title">
                  {entry ? entry.title || "📝" : ""}
                  {entry?.duplicates?.length ? (
                    <span
                      className="lw-day-dup"
                      title={t("dupDay", { n: entry.duplicates.length + 1, files: [entry.path, ...entry.duplicates].map((p) => p.slice(p.lastIndexOf("/") + 1)).join(", ") })}
                    >
                      {" "}⚠
                    </span>
                  ) : null}
                </span>
                <span className="lw-day-action">{entry ? t("dayOpen") : t("dayCreate")}</span>
              </button>
            );
          })}
        </div>

        <div className="lw-day-week-edit">
          <Palette legend={legend} value={week?.color} onPick={(c) => onWeekColor(n, c)} />
          <input
            className="lw-qe-title"
            placeholder={t("titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
            }}
          />
          <button
            className="lw-qe-open"
            onClick={() => onOpenWeek(n)}
            onContextMenu={(e) => {
              e.preventDefault();
              onOpenWeek(n, true);
            }}
            onAuxClick={(e) => e.button === 1 && onOpenWeek(n, true)}
            title={t("bgHint")}
          >
            {week ? t("weekNoteOpen") : t("weekNoteCreate")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
