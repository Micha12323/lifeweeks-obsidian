import { useEffect, useRef, useState } from "react";
import type { LegendState } from "../core/types";
import { t } from "../i18n";
import { FIXED_LEGEND_KEYS, legendDefaults } from "./constants";

function EditableLabel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing && ref.current) ref.current.select();
  }, [editing]);
  const commit = () => {
    setEditing(false);
    const t = draft.trim();
    if (t) onChange(t);
    else setDraft(value);
  };
  if (editing)
    return (
      <input
        ref={ref}
        className="lw-legend-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  return (
    <span
      className="lw-legend-label"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title={t("legendRename")}
    >
      {value}
    </span>
  );
}

/**
 * Editierbare Legende pro Tab – Port aus WeekGrid der Browser-App:
 * Farben/Labels änderbar, feste Einträge ausblendbar, eigene Einträge (+),
 * Reihenfolge per Drag&Drop.
 */
export function Legend({
  legend,
  onChange,
}: {
  legend: LegendState;
  onChange: (changes: Partial<LegendState>) => void;
}) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fixed = new Set<string>(FIXED_LEGEND_KEYS);
  const extraMap = Object.fromEntries(legend.extras.map((e) => [String(e.id), e]));

  const items = legend.order
    .map((id) => {
      if (fixed.has(id)) return legend.hidden.includes(id) ? null : { id, type: "fixed" as const };
      const ex = extraMap[id];
      return ex ? { id, type: "extra" as const, ex } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const reorder = (from: string, to: string) => {
    const arr = [...legend.order];
    const i = arr.indexOf(from);
    const j = arr.indexOf(to);
    if (i === -1 || j === -1 || i === j) return;
    arr.splice(j, 0, arr.splice(i, 1)[0]);
    onChange({ order: arr });
  };

  return (
    <div className="lw-legend">
      {items.map((item) => (
        <div
          key={item.id}
          className={`lw-legend-item ${dragOverId === item.id ? "drag-over" : ""}`}
          draggable={true}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", item.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverId(item.id);
          }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverId(null);
            const from = e.dataTransfer.getData("text/plain");
            if (from !== item.id) reorder(from, item.id);
          }}
        >
          <span className="lw-drag-handle">⠿</span>
          {item.type === "fixed" ? (
            <>
              <input
                type="color"
                className="lw-legend-color-pick"
                value={legend.colors[item.id]}
                onChange={(e) => onChange({ colors: { ...legend.colors, [item.id]: e.target.value } })}
              />
              <EditableLabel
                value={legend.labels[item.id] ?? legendDefaults()[item.id]}
                onChange={(val) => onChange({ labels: { ...legend.labels, [item.id]: val } })}
              />
              {item.id !== "past" && (
                <button
                  className="lw-legend-remove"
                  onClick={() => onChange({ hidden: [...legend.hidden, item.id] })}
                >
                  ×
                </button>
              )}
            </>
          ) : (
            <>
              <input
                type="color"
                className="lw-legend-color-pick"
                value={item.ex.color}
                onChange={(e) =>
                  onChange({
                    extras: legend.extras.map((x) =>
                      x.id === item.ex.id ? { ...x, color: e.target.value } : x
                    ),
                  })
                }
              />
              <EditableLabel
                value={item.ex.label}
                onChange={(val) =>
                  onChange({
                    extras: legend.extras.map((x) =>
                      x.id === item.ex.id ? { ...x, label: val } : x
                    ),
                  })
                }
              />
              <button
                className="lw-legend-remove"
                onClick={() => {
                  const extras = legend.extras.filter((x) => x.id !== item.ex.id);
                  onChange({ extras, order: legend.order.filter((id) => id !== item.id) });
                }}
              >
                ×
              </button>
            </>
          )}
        </div>
      ))}
      <button
        className="lw-legend-add"
        title={t("legendAddTitle")}
        onClick={() => {
          const restore = ["current", "future", "entry"].find((k) => legend.hidden.includes(k));
          if (restore) {
            onChange({ hidden: legend.hidden.filter((k) => k !== restore) });
          } else {
            const id = String(Date.now());
            onChange({
              extras: [...legend.extras, { id, color: "#7c5cc9", label: t("legendNew") }],
              order: [...legend.order, id],
            });
          }
        }}
      >
        +
      </button>
    </div>
  );
}
