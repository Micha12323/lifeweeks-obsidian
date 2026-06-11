import { useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n";

/**
 * Datumsbereich-Auswahl (Port aus der Browser-App): markiert alle Wochen,
 * die den Zeitraum überlappen, und aktiviert die Mehrfachauswahl.
 */
export function DateRangeModal({
  onApply,
  onClose,
}: {
  onApply: (from: string, to: string) => void;
  onClose: () => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const valid = !!from && !!to && from <= to;

  return createPortal(
    <div className="lw-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lw-modal">
        <div className="lw-qe-head">
          <h3>{t("dateRangeTitle")}</h3>
          <button className="lw-qe-close" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="lw-muted lw-modal-note">{t("dateRangeHint")}</p>
        <label className="lw-modal-row">
          {t("from")}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="lw-modal-row">
          {t("to")}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <div className="lw-modal-foot">
          <button onClick={onClose}>{t("cancel")}</button>
          <button className="mod-cta" disabled={!valid} onClick={() => onApply(from, to)}>
            {t("apply")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
