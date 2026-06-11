import { useState } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { dayDates, localIso, weekKey } from "../core/dates";
import type { TabWeeks } from "../core/types";
import type { DailyIdx } from "../data/DailyIndex";
import { displayWeekLabel, t, weekdayLabel } from "../i18n";
import { PALETTE } from "./constants";

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
  onOpenDay: (iso: string) => void;
  onOpenWeek: (n: number) => void;
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
                title={entry ? t("dayOpenTitle") : t("dayCreateTitle")}
              >
                <span className="lw-day-dot" style={{ background: entry?.color ?? "transparent" }} />
                <span className="lw-day-label">{weekdayLabel(d.date)}</span>
                <span className="lw-day-title">{entry ? entry.title || "📝" : ""}</span>
                <span className="lw-day-action">{entry ? t("dayOpen") : t("dayCreate")}</span>
              </button>
            );
          })}
        </div>

        <div className="lw-day-week-edit">
          <div className="lw-qe-palette">
            <div
              className={`lw-swatch lw-swatch-none ${!week?.color ? "active" : ""}`}
              title={t("noColor")}
              onClick={() => onWeekColor(n, null)}
            />
            {PALETTE.map((c) => (
              <div
                key={c}
                className={`lw-swatch ${week?.color === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => onWeekColor(n, c)}
              />
            ))}
            <input
              type="color"
              className="lw-swatch-custom"
              value={week?.color ?? "#c97c3a"}
              onChange={(e) => onWeekColor(n, e.target.value)}
              title={t("customColor")}
            />
          </div>
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
          <button className="lw-qe-open" onClick={() => onOpenWeek(n)}>
            {week ? t("weekNoteOpen") : t("weekNoteCreate")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
