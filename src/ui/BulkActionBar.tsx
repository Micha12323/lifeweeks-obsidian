import { useState } from "react";
import { t } from "../i18n";
import { PALETTE } from "./constants";

/**
 * Aktionsleiste im Multi-Select-Modus: Farbe/Titel/Inhalt auf alle
 * markierten Wochen anwenden (Port aus der Browser-App).
 * Leere Eingabe (keine Farbe, kein Text) löscht die markierten Einträge.
 */
export function BulkActionBar({
  count,
  onApply,
  onClear,
}: {
  count: number;
  onApply: (color: string | null, title: string, content: string) => Promise<void>;
  onClear: () => void;
}) {
  const [color, setColor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    setBusy(true);
    try {
      await onApply(color, title.trim(), content);
      setColor(null);
      setTitle("");
      setContent("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lw-bulk-bar">
      <div className="lw-qe-palette">
        <div
          className={`lw-swatch lw-swatch-none ${!color ? "active" : ""}`}
          title={t("noColor")}
          onClick={() => setColor(null)}
        />
        {PALETTE.map((c) => (
          <div
            key={c}
            className={`lw-swatch ${color === c ? "active" : ""}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
        <input
          type="color"
          className="lw-swatch-custom"
          value={color ?? "#c97c3a"}
          onChange={(e) => setColor(e.target.value)}
          title={t("customColor")}
        />
      </div>
      <input
        className="lw-bulk-title"
        placeholder={t("bulkTitle")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="lw-bulk-content"
        placeholder={t("bulkContent")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
      />
      <div className="lw-bulk-actions">
        <button className="lw-qe-open" disabled={busy || count === 0} onClick={() => void apply()}>
          {busy ? t("bulkSaving") : count === 1 ? t("bulkApplyOne") : t("bulkApply", { n: count })}
        </button>
        <button className="lw-qe-close" title={t("bulkClear")} onClick={onClear}>
          ×
        </button>
      </div>
      {!color && !content.trim() && count > 0 && <div className="lw-bulk-hint">{t("bulkHint")}</div>}
    </div>
  );
}
