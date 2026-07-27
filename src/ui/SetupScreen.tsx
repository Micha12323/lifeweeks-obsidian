import { useState } from "react";
import { t } from "../i18n";
import type LifeWeeksPlugin from "../main";

/**
 * Erststart: Geburtsdatum + Lebenserwartung + Basisordner erfassen.
 * Tabs werden automatisch aus den Ordnern unter "Weekly basis/" abgeleitet.
 */
export function SetupScreen({ plugin, onDone }: { plugin: LifeWeeksPlugin; onDone: () => void }) {
  const [name, setName] = useState(plugin.settings.userName);
  const [birthDate, setBirthDate] = useState(plugin.settings.birthDate);
  const [lifeExp, setLifeExp] = useState(String(plugin.settings.lifeExpectancy));
  const [basePath, setBasePath] = useState(plugin.settings.basePath);

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && parseInt(lifeExp, 10) > 0;

  const save = async () => {
    plugin.settings.userName = name.trim();
    plugin.settings.birthDate = birthDate;
    plugin.settings.lifeExpectancy = parseInt(lifeExp, 10);
    plugin.settings.basePath = basePath.replace(/^\/+|\/+$/g, "");
    await plugin.saveSettings();
    onDone();
  };

  return (
    <div className="lw-setup">
      <h2>{t("setupTitle")}</h2>
      <p className="lw-muted">{t("setupInfo")}</p>
      <label>
        {t("nameOptional")}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Michael" />
      </label>
      <label>
        {t("birthDateLabel")}
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </label>
      <label>
        {t("settingLifeExp")}
        <input
          type="number"
          min={1}
          max={130}
          value={lifeExp}
          onChange={(e) => setLifeExp(e.target.value)}
        />
      </label>
      <label>
        {t("basePathLabel")}
        <input value={basePath} onChange={(e) => setBasePath(e.target.value)} placeholder="Bibliothek/Diary" />
      </label>
      <button className="lw-qe-open" disabled={!valid} onClick={() => void save()}>
        {t("start")}
      </button>
    </div>
  );
}
