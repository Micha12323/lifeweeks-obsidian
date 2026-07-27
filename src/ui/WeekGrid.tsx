import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  birthdayWeekNum,
  complementaryHex,
  currentWeekNum,
  localIso,
  weekKey,
  weekStartDate,
} from "../core/dates";
import { computeMilestoneWeeks } from "../core/milestones";
import type { LegendState, TabWeeks } from "../core/types";
import type { DailyIdx } from "../data/DailyIndex";
import { displayWeekLabel, t } from "../i18n";
import { FIXED_WIDTH } from "./constants";
import { Legend } from "./Legend";

interface GridProps {
  birthDate: string;
  lifeExpectancy: number;
  weeksData: TabWeeks;
  dailyIdx: DailyIdx;
  zoomLevel: number;
  normalZoom: boolean;
  showMilestones: boolean;
  legend: LegendState;
  onLegendChange: (changes: Partial<LegendState>) => void;
  multiSelectMode: boolean;
  selectedWeeks: Set<number>;
  onZoomDelta: (delta: number) => void;
  onCellClick: (n: number, x: number, y: number) => void;
  onCellContext: (n: number, x: number, y: number) => void;
  onCellDown: (n: number) => void;
  onCellEnter: (n: number) => void;
  onLongPress: (n: number) => void;
}

/** Maximale Zellgröße beim Hineinzoomen (px) */
const MAX_CELL = 24;

/** Feste Zellgröße im Modus "Normalgröße" (px), unabhängig von der Fenstergröße */
const NORMAL_CELL = 10;

interface CellInfo {
  n: number;
  bg: string;
  isCur: boolean;
  isBirthday: boolean;
  isSelected: boolean;
  hasMilestone: boolean;
  dayCount: number;
}

const WeekCell = memo(function WeekCell({ c }: { c: CellInfo }) {
  const cls = [
    "lw-cell",
    c.isCur ? "cur" : "",
    c.isBirthday ? "birthday" : "",
    c.isSelected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={cls}
      data-n={c.n}
      style={{
        background: c.bg,
        ...(c.hasMilestone ? { outline: "2px solid #999", outlineOffset: "-2px" } : {}),
      }}
    >
      {c.dayCount > 0 && (
        <span className="lw-cell-day-count" style={{ color: complementaryHex(c.bg) }}>
          {c.dayCount}
        </span>
      )}
    </div>
  );
});

const GridBody = memo(function GridBody({
  rows,
  years,
  birthYear,
  cellSize,
}: {
  rows: CellInfo[][];
  years: number;
  birthYear: number;
  cellSize: number;
}) {
  return (
    <div className="lw-grid-body" style={{ "--lw-cell": `${cellSize}px` } as React.CSSProperties}>
      <div className="lw-grid-hrow">
        <div className="lw-axis-l" />
        {Array.from({ length: 52 }, (_, w) => (
          <Fragment key={w}>
            {w > 0 && w % 4 === 0 && <div className="lw-h-gap" />}
            <div className="lw-grid-hcell">{(w + 1) % 4 === 0 ? w + 1 : ""}</div>
          </Fragment>
        ))}
        <div className="lw-axis-r" />
      </div>
      {Array.from({ length: years }, (_, y) => (
        <Fragment key={y}>
          {y > 0 && y % 10 === 0 && <div className="lw-v-gap" />}
          <div className="lw-grid-row">
            <div className="lw-axis-l">{y % 10 === 0 && <span className="lw-axis-age">{y}</span>}</div>
            {rows[y].map((c, w) => (
              <Fragment key={w}>
                {w > 0 && w % 4 === 0 && <div className="lw-h-gap" />}
                <WeekCell c={c} />
              </Fragment>
            ))}
            <div className="lw-axis-r">
              {y % 10 === 0 && <span className="lw-axis-year">{birthYear + y}</span>}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
});

export function WeekGrid({
  birthDate,
  lifeExpectancy,
  weeksData,
  dailyIdx,
  zoomLevel,
  normalZoom,
  showMilestones,
  legend,
  onLegendChange,
  multiSelectMode,
  selectedWeeks,
  onZoomDelta,
  onCellClick,
  onCellContext,
  onCellDown,
  onCellEnter,
  onLongPress,
}: GridProps) {
  const years = lifeExpectancy;
  const total = years * 52;
  const birthYear = new Date(birthDate).getFullYear();
  const curN = useMemo(() => currentWeekNum(birthDate), [birthDate]);
  const birthdayWeekN = useMemo(() => birthdayWeekNum(birthDate), [birthDate]);
  const milestoneWeeks = useMemo(
    () =>
      showMilestones ? computeMilestoneWeeks(birthDate, lifeExpectancy) : new Map<number, string[]>(),
    [birthDate, lifeExpectancy, showMilestones]
  );

  // Tages-Badges: Anzahl Tageseinträge pro Woche; 7 Tage + Wocheneintrag = 8
  const dailyCounts = useMemo(() => {
    const result: Record<number, number> = {};
    if (!Object.keys(dailyIdx).length) return result;
    for (let y = 0; y < years; y++) {
      for (let w = 0; w < 52; w++) {
        const n = y * 52 + w;
        const start = weekStartDate(birthDate, n);
        let count = 0;
        for (let d = 0; d < 7; d++) {
          const date = new Date(start);
          date.setDate(date.getDate() + d);
          if (dailyIdx[localIso(date)]) count++;
        }
        if (count === 7 && weeksData[weekKey(birthDate, n)]?.hasEntry) result[n] = 8;
        else if (count > 0) result[n] = count;
      }
    }
    return result;
  }, [dailyIdx, birthDate, years, weeksData]);

  const [cellSize, setCellSize] = useState(10);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gridWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return;
      if (normalZoom) {
        setCellSize(NORMAL_CELL);
        return;
      }
      // Kennlinie: 0 = alles sichtbar (fitAll) · 50 = Fensterbreite (fitWidth) · 100 = MAX_CELL
      // fitWidth ungedeckelt, damit die 52 Spalten das Fenster wirklich füllen;
      // bei sehr breiten Fenstern kann fitWidth über MAX_CELL liegen
      const fitWidth = Math.max(3, Math.floor((wrapRef.current.clientWidth - FIXED_WIDTH) / 52));
      const avail = (gridWrapRef.current?.clientHeight ?? window.innerHeight) - 70;
      const vGaps = Math.floor(years / 10) * 5;
      const fitAll = Math.max(2, Math.floor((avail - vGaps) / years) - 2);
      const t = (zoomLevel ?? 50) / 100;
      const size =
        t <= 0.5
          ? fitAll + (fitWidth - fitAll) * (t / 0.5)
          : fitWidth + (Math.max(MAX_CELL, fitWidth) - fitWidth) * ((t - 0.5) / 0.5);
      setCellSize(Math.max(2, Math.round(size)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [zoomLevel, normalZoom, years]);

  // Beim Zoomen immer auf die aktuelle Woche zentrieren
  useEffect(() => {
    const el = wrapRef.current?.querySelector(`.lw-cell[data-n="${curN}"]`);
    el?.scrollIntoView({ block: "center", inline: "center" });
  }, [cellSize, curN]);

  // Strg+Mausrad (Desktop) bzw. Trackpad-Pinch (sendet ctrl+wheel) zoomt.
  // Nativer Listener mit passive:false, damit preventDefault greift.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      onZoomDelta(e.deltaY < 0 ? 4 : -4);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onZoomDelta]);

  const lc = legend.colors;
  const rows = useMemo(
    () =>
      Array.from({ length: years }, (_, y) =>
        Array.from({ length: 52 }, (_, w): CellInfo => {
          const n = y * 52 + w;
          const data = weeksData[weekKey(birthDate, n)] || null;
          const isCur = n === curN;
          const isBirthday = n === birthdayWeekN;
          let bg: string;
          if (data?.color) bg = data.color;
          else if (isBirthday) bg = "#4caf7a";
          else if (isCur) bg = lc.current;
          else if (n < curN) bg = lc.past;
          else bg = lc.future;
          return {
            n,
            bg,
            isCur,
            isBirthday,
            isSelected: selectedWeeks.has(n),
            hasMilestone: milestoneWeeks.has(n),
            dayCount: dailyCounts[n] || 0,
          };
        })
      ),
    [birthDate, curN, birthdayWeekN, weeksData, years, milestoneWeeks, lc, selectedWeeks, dailyCounts]
  );

  // ── Ein globaler Tooltip per Event-Delegation (statt 4680 Instanzen) ──
  const [tipN, setTipN] = useState<number | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const moveTip = (x: number, y: number) => {
    if (tipRef.current) {
      tipRef.current.style.left = `${x + 14}px`;
      tipRef.current.style.top = `${y - 52}px`;
    }
  };
  const cellFromEvent = (e: { target: EventTarget | null }): number | null => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".lw-cell") ?? null;
    return el ? Number(el.dataset.n) : null;
  };

  // ── Long-Press (Pointer Events, auch Touch) ──────────────────────
  const longTimer = useRef<number | null>(null);
  const didLong = useRef(false);
  const downPos = useRef({ x: 0, y: 0 });
  const cancelLong = () => {
    if (longTimer.current !== null) {
      window.clearTimeout(longTimer.current);
      longTimer.current = null;
    }
  };
  useEffect(() => cancelLong, []);

  // ── Pinch-Zoom (zwei Finger, Mobile) ─────────────────────────────
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef(0);
  const pinchDistance = () => {
    const pts = [...pointers.current.values()];
    return pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
  };

  const tooltip = useMemo(() => {
    if (tipN === null) return null;
    const lb = displayWeekLabel(birthDate, tipN);
    const data = weeksData[weekKey(birthDate, tipN)];
    const milestones = milestoneWeeks.get(tipN);
    const dayCount = dailyCounts[tipN] || 0;
    return (
      <div className="lw-tooltip" ref={tipRef}>
        {data?.title ? (
          <>
            <div className="lw-tip-title">{data.title}</div>
            <div className="lw-tip-sub">{lb.life}</div>
          </>
        ) : (
          <div className="lw-tip-title">{lb.life}</div>
        )}
        <div className="lw-tip-dates">{lb.dates}</div>
        {tipN === birthdayWeekN && <div className="lw-tip-birthday">{t("birthday")}</div>}
        {data?.hasEntry && <div className="lw-tip-entry">{t("weekEntry")}</div>}
        {dayCount > 0 && (
          <div className="lw-tip-entry">
            📅 {dayCount === 8 ? t("daysFull") : t("days", { n: dayCount })}
          </div>
        )}
        {milestones?.map((m, i) => (
          <div key={i} className="lw-tip-milestone">
            {t("milestonePrefix")}
            {m}
          </div>
        ))}
      </div>
    );
  }, [tipN, birthDate, weeksData, birthdayWeekN, milestoneWeeks, dailyCounts]);

  // Zählt alle Wochen mit Notiz im Tab (auch reine Farb-Einträge ohne Text)
  const entryCount = useMemo(() => Object.keys(weeksData).length, [weeksData]);
  const livedPct = Math.min(100, (Math.max(0, curN) / total) * 100).toFixed(1);

  return (
    <div ref={gridWrapRef} className={`lw-grid-wrap ${multiSelectMode ? "select-mode" : ""}`}>
      <div
        ref={wrapRef}
        className="lw-grid-center"
        onClick={(e) => {
          if (multiSelectMode) return;
          if (didLong.current) {
            didLong.current = false;
            return;
          }
          const n = cellFromEvent(e);
          if (n !== null) onCellClick(n, e.clientX, e.clientY);
        }}
        onContextMenu={(e) => {
          if (multiSelectMode) return;
          const n = cellFromEvent(e);
          if (n !== null) {
            e.preventDefault();
            cancelLong();
            setTipN(null);
            onCellContext(n, e.clientX, e.clientY);
          }
        }}
        onPointerDown={(e) => {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2) {
            // Zweiter Finger: Pinch beginnt, Long-Press abbrechen
            cancelLong();
            pinchDist.current = pinchDistance();
            return;
          }
          const n = cellFromEvent(e);
          if (n === null) return;
          if (multiSelectMode) {
            e.preventDefault();
            onCellDown(n);
            return;
          }
          didLong.current = false;
          downPos.current = { x: e.clientX, y: e.clientY };
          cancelLong();
          longTimer.current = window.setTimeout(() => {
            didLong.current = true;
            setTipN(null);
            onLongPress(n);
          }, 500);
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2 && pinchDist.current > 0) {
            const d = pinchDistance();
            onZoomDelta((d - pinchDist.current) / 3);
            pinchDist.current = d;
          }
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          pinchDist.current = 0;
          cancelLong();
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          pinchDist.current = 0;
          cancelLong();
        }}
        onMouseOver={(e) => {
          const n = cellFromEvent(e);
          setTipN(n);
          if (n !== null) {
            moveTip(e.clientX, e.clientY);
            if (multiSelectMode) onCellEnter(n);
          }
        }}
        onMouseMove={(e) => {
          moveTip(e.clientX, e.clientY);
          // Long-Press abbrechen, wenn der Zeiger deutlich bewegt wird (Scroll/Drag)
          if (
            longTimer.current !== null &&
            Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y) > 10
          ) {
            cancelLong();
          }
        }}
        onMouseLeave={() => {
          setTipN(null);
          cancelLong();
        }}
      >
        {/* Legende scrollt mit dem Grid nach oben aus dem Bild */}
        <div className="lw-grid-inner">
          <Legend legend={legend} onChange={onLegendChange} />
          <GridBody rows={rows} years={years} birthYear={birthYear} cellSize={cellSize} />
        </div>
      </div>

      <div className="lw-counter-bar">
        {t("counter", { cur: Math.max(0, curN + 1), total, pct: livedPct, count: entryCount })}
        {multiSelectMode && selectedWeeks.size > 0 && <> · {t("selected", { n: selectedWeeks.size })}</>}
      </div>

      {tooltip && createPortal(tooltip, document.body)}
    </div>
  );
}
