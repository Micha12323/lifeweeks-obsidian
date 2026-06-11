import { useState } from "react";
import { createPortal } from "react-dom";
import type { TabConfig } from "../core/types";
import { fmtDateLocal, t } from "../i18n";

/**
 * Zeitachsen-Einstellungen pro Tab (Port von TabSettingsModal):
 * eigenes Startdatum + Lebenserwartung/Laufzeit, Meilensteine, eigene Tages-Doku.
 * Portal in document.body wegen contain:strict der Obsidian-Leaves.
 */
export function TabSettingsModal({
  tabName,
  config,
  globalBirthDate,
  globalLifeExpectancy,
  onSave,
  onClose,
}: {
  tabName: string;
  config: TabConfig;
  globalBirthDate: string;
  globalLifeExpectancy: number;
  onSave: (changes: TabConfig) => void;
  onClose: () => void;
}) {
  const [useOwn, setUseOwn] = useState(!!config.birthDate);
  const [birthDate, setBirthDate] = useState(config.birthDate || globalBirthDate || "");
  const [lifeExp, setLifeExp] = useState(String(config.lifeExpectancy || globalLifeExpectancy || 90));
  const [showMilestones, setShowMilestones] = useState(config.showMilestones ?? true);
  const [ownDaily, setOwnDaily] = useState(!!config.ownDailyBasis);

  const save = () => {
    onSave({
      ...(useOwn
        ? { birthDate, lifeExpectancy: parseInt(lifeExp, 10) || globalLifeExpectancy }
        : { birthDate: null, lifeExpectancy: null }),
      showMilestones,
      ownDailyBasis: ownDaily,
    });
    onClose();
  };

  const endDate =
    useOwn && birthDate
      ? new Date(
          new Date(birthDate).getFullYear() + (parseInt(lifeExp, 10) || 0),
          new Date(birthDate).getMonth(),
          new Date(birthDate).getDate()
        )
      : null;

  return createPortal(
    <div className="lw-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lw-modal">
        <div className="lw-qe-head">
          <h3>{t("tabAxisTitle", { tab: tabName })}</h3>
          <button className="lw-qe-close" onClick={onClose}>
            ×
          </button>
        </div>
        <label className="lw-toggle">
          <input type="checkbox" checked={useOwn} onChange={(e) => setUseOwn(e.target.checked)} />
          <span>{t("useOwnAxis")}</span>
        </label>
        <label className="lw-toggle">
          <input
            type="checkbox"
            checked={showMilestones}
            onChange={(e) => setShowMilestones(e.target.checked)}
          />
          <span>{t("showMilestones")}</span>
        </label>
        <label className="lw-toggle">
          <input type="checkbox" checked={ownDaily} onChange={(e) => setOwnDaily(e.target.checked)} />
          <span>{t("ownDaily", { path: `Daily basis/${tabName}/` })}</span>
        </label>
        {!ownDaily && <p className="lw-muted lw-modal-hint">{t("sharedDaily")}</p>}
        {useOwn && (
          <>
            <label className="lw-modal-row">
              {t("startDate")}
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </label>
            <label className="lw-modal-row">
              {t("lifeExpYears")}
              <input
                type="number"
                min={1}
                max={200}
                value={lifeExp}
                onChange={(e) => setLifeExp(e.target.value)}
              />
            </label>
            {endDate && (
              <p className="lw-muted lw-modal-note">
                {t("period", { from: fmtDateLocal(new Date(birthDate)), to: fmtDateLocal(endDate) })}
              </p>
            )}
          </>
        )}
        <div className="lw-modal-foot">
          <button onClick={onClose}>{t("cancel")}</button>
          <button className="mod-cta" disabled={useOwn && !birthDate} onClick={save}>
            {t("save")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
