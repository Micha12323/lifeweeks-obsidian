import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { WeekData } from "../core/types";
import { displayWeekLabel, t } from "../i18n";
import { PALETTE } from "./constants";

interface QuickEditProps {
  n: number;
  x: number;
  y: number;
  birthDate: string;
  data: WeekData | null;
  onColor: (n: number, color: string | null) => void;
  onTitle: (n: number, title: string) => void;
  onOpen: (n: number) => void;
  onClose: () => void;
}

/**
 * Kleines Popover bei Klick auf eine Zelle: Farbe + Titel (Frontmatter)
 * und „Notiz öffnen“. Der Markdown-Inhalt wird bewusst nicht hier editiert –
 * dafür öffnet sich die Notiz im nativen Obsidian-Editor.
 * Wird per Portal in document.body gerendert: Obsidian-Leaves setzen
 * contain:strict, wodurch position:fixed sonst am (schmalen) Panel klebt.
 */
export function WeekQuickEdit({ n, x, y, birthDate, data, onColor, onTitle, onOpen, onClose }: QuickEditProps) {
  const lb = displayWeekLabel(birthDate, n);
  const [title, setTitle] = useState(data?.title ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Popover im Viewport halten
  const [pos, setPos] = useState({ left: x, top: y + 12 });
  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(x, window.innerWidth - r.width - 12)),
      top: y + 12 + r.height > window.innerHeight ? Math.max(8, y - r.height - 12) : y + 12,
    });
  }, [x, y]);

  const commitTitle = () => {
    const tt = title.trim();
    if (tt !== (data?.title ?? "")) onTitle(n, tt);
  };

  return createPortal(
    <div className="lw-qe-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lw-qe" ref={ref} style={{ left: pos.left, top: pos.top }}>
        <div className="lw-qe-head">
          <div>
            <div className="lw-qe-life">{lb.life}</div>
            <div className="lw-qe-dates">{lb.dates}</div>
          </div>
          <button className="lw-qe-close" onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        </div>

        <div className="lw-qe-palette">
          <div
            className={`lw-swatch lw-swatch-none ${!data?.color ? "active" : ""}`}
            title={t("noColor")}
            onClick={() => onColor(n, null)}
          />
          {PALETTE.map((c) => (
            <div
              key={c}
              className={`lw-swatch ${data?.color === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => onColor(n, c)}
            />
          ))}
          <input
            type="color"
            className="lw-swatch-custom"
            value={data?.color ?? "#c97c3a"}
            onChange={(e) => onColor(n, e.target.value)}
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

        <button className="lw-qe-open" onClick={() => onOpen(n)}>
          {data ? t("openNote") : t("createNote")}
        </button>
      </div>
    </div>,
    document.body
  );
}
