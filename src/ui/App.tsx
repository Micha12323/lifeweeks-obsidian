import { Notice, TFile, WorkspaceLeaf, debounce } from "obsidian";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { actualAge, weekKey, weekLabel, weekStartDate } from "../core/dates";
import {
  buildDailyContent,
  buildWeekFileContent,
  dailyFilename,
  weekFilename,
} from "../core/filenames";
import type { LegendState, TabConfig } from "../core/types";
import { buildDailyIndex, dailyBasisPath } from "../data/DailyIndex";
import {
  buildWeekIndex,
  getFile,
  getFolder,
  listTabs,
  tabFolderPath,
  weeklyBasisPath,
} from "../data/WeekIndex";
import { t } from "../i18n";
import type LifeWeeksPlugin from "../main";
import { BulkActionBar } from "./BulkActionBar";
import { normalizeLegend } from "./constants";
import { DateRangeModal } from "./DateRangeModal";
import { DayPanel } from "./DayPanel";
import { SetupScreen } from "./SetupScreen";
import { TabSettingsModal } from "./TabSettingsModal";
import { WeekGrid } from "./WeekGrid";
import { WeekQuickEdit } from "./WeekQuickEdit";

export function LifeWeeksApp({ plugin }: { plugin: LifeWeeksPlugin }) {
  const { app } = plugin;
  const [settingsV, setSettingsV] = useState(0);
  const [indexV, setIndexV] = useState(0);
  const [activeTabName, setActiveTabName] = useState<string | null>(null);
  // 50 = Fensterbreite (Mitte der Zoom-Kennlinie)
  const [zoom, setZoom] = useState(50);
  // Normalgröße: feste Zellgröße unabhängig vom Fenster (übersteuert den Slider)
  const [normalZoom, setNormalZoom] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [quickEdit, setQuickEdit] = useState<{ n: number; x: number; y: number } | null>(null);
  const [dayPanelN, setDayPanelN] = useState<number | null>(null);
  const [showTabSettings, setShowTabSettings] = useState(false);
  const [addingTab, setAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const noteLeafRef = useRef<WorkspaceLeaf | null>(null);
  const noteLeafMode = useRef<"split" | "tab" | null>(null);

  // ── Multi-Select ──────────────────────────────────────────────────
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const isDragging = useRef(false);
  const dragAction = useRef<"select" | "deselect">("select");
  const dragStartN = useRef(-1);
  const dragBaseSelection = useRef<Set<number>>(new Set());

  useEffect(() => {
    const up = () => {
      isDragging.current = false;
    };
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, []);

  const settings = plugin.settings;

  // Vault-/Cache-Events → Index neu aufbauen (debounced)
  useEffect(() => {
    const bump = debounce(() => setIndexV((v) => v + 1), 400, true);
    const cacheRef = app.metadataCache.on("changed", bump);
    const vaultRefs = [
      app.vault.on("create", bump),
      app.vault.on("delete", bump),
      app.vault.on("rename", bump),
    ];
    return () => {
      app.metadataCache.offref(cacheRef);
      vaultRefs.forEach((r) => app.vault.offref(r));
    };
  }, [app]);

  const tabs = useMemo(
    () => listTabs(app, settings.basePath),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Neuberechnung wird bewusst über die Versions-Zähler (indexV/settingsV) ausgelöst, nicht über alle Einzel-Dependencies
    [app, settings.basePath, indexV, settingsV]
  );
  const tab = tabs.find((t) => t.name === activeTabName) ?? tabs[0] ?? null;

  // ── Effektive Zeitachse (Tab überschreibt global) ─────────────────
  const tabConfig: TabConfig = (tab && settings.tabConfigs[tab.name]) || {};
  const bd = tabConfig.birthDate || settings.birthDate;
  const lifeExpectancy = tabConfig.lifeExpectancy || settings.lifeExpectancy;
  const showMilestones = tabConfig.showMilestones ?? true;

  const weeksData = useMemo(
    () => (tab ? buildWeekIndex(app, settings.basePath, tab.name, bd, lifeExpectancy) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Neuberechnung wird bewusst über die Versions-Zähler (indexV/settingsV) ausgelöst, nicht über alle Einzel-Dependencies
    [app, settings.basePath, bd, lifeExpectancy, tab?.name, indexV, settingsV]
  );

  // ── Tages-Index (geteilt oder pro Tab, siehe ownDailyBasis) ───────
  const dailyPath = dailyBasisPath(settings.basePath, tabConfig.ownDailyBasis ? tab?.name : null);
  const dailyIdx = useMemo(
    () => buildDailyIndex(app, dailyPath),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Neuberechnung wird bewusst über die Versions-Zähler (indexV/settingsV) ausgelöst, nicht über alle Einzel-Dependencies
    [app, dailyPath, indexV, settingsV]
  );

  // ── Legende (pro Tab, in Plugin-Settings persistiert) ─────────────
  const legend: LegendState = useMemo(
    () => normalizeLegend(tab ? settings.legends[tab.name] : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Neuberechnung wird bewusst über die Versions-Zähler (indexV/settingsV) ausgelöst, nicht über alle Einzel-Dependencies
    [tab?.name, settingsV]
  );

  const handleLegendChange = useCallback(
    (changes: Partial<LegendState>) => {
      if (!tab) return;
      settings.legends[tab.name] = { ...normalizeLegend(settings.legends[tab.name]), ...changes };
      void plugin.saveSettings();
      setSettingsV((v) => v + 1);
    },
    [plugin, settings, tab]
  );

  // ── Schreib-Aktionen ──────────────────────────────────────────────
  const ensureFolder = useCallback(async (): Promise<string> => {
    if (!tab) throw new Error("No active tab");
    const folderPath = tabFolderPath(settings.basePath, tab.name);
    if (!getFolder(app, folderPath)) await app.vault.createFolder(folderPath);
    return folderPath;
  }, [app, tab, settings.basePath]);

  const ensureWeekFile = useCallback(
    async (n: number, opts: { color?: string | null; title?: string }): Promise<TFile> => {
      const existing = weeksData[weekKey(bd, n)];
      if (existing) {
        const f = getFile(app, existing.path);
        if (f) return f;
      }
      const folderPath = await ensureFolder();
      const fn = weekFilename(bd, n, opts.title ?? null);
      const content = buildWeekFileContent(weekLabel(bd, n), opts.color ?? null, opts.title ?? null, "");
      return await app.vault.create(`${folderPath}/${fn}`, content);
    },
    [app, bd, weeksData, ensureFolder]
  );

  const handleColor = useCallback(
    async (n: number, color: string | null) => {
      try {
        const existing = weeksData[weekKey(bd, n)];
        if (existing) {
          const file = getFile(app, existing.path);
          if (!file) return;
          await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
            if (color) fm.color = color;
            else delete fm.color;
          });
        } else if (color) {
          await ensureWeekFile(n, { color });
        }
      } catch (e) {
        new Notice(t("errColor", { err: String(e) }));
      }
    },
    [app, bd, weeksData, ensureWeekFile]
  );

  const handleTitle = useCallback(
    async (n: number, title: string) => {
      try {
        const existing = weeksData[weekKey(bd, n)];
        if (existing) {
          const file = getFile(app, existing.path);
          if (!file) return;
          await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
            if (title) fm.title = title;
            else delete fm.title;
          });
          const newName = weekFilename(bd, n, title);
          if (file.name !== newName && file.parent) {
            await app.fileManager.renameFile(file, `${file.parent.path}/${newName}`);
          }
        } else if (title) {
          await ensureWeekFile(n, { title });
        }
      } catch (e) {
        new Notice(t("errTitle", { err: String(e) }));
      }
    },
    [app, bd, weeksData, ensureWeekFile]
  );

  const openInSplit = useCallback(
    async (file: TFile) => {
      // Öffnen-Modus: live aus den Plugin-Settings lesen (SettingTab mutiert
      // dasselbe Objekt); bei "auto" entscheidet die Workspace-Breite
      const width = app.workspace.containerEl?.clientWidth || window.innerWidth;
      const cfg = plugin.settings.openMode;
      const mode: "split" | "tab" = cfg === "auto" ? (width >= 1000 ? "split" : "tab") : cfg;
      let leaf = noteLeafRef.current;
      // Bei Moduswechsel das alte Leaf schließen, sonst bleibt z.B. die alte
      // Split-Gruppe stehen und es wirkt, als würde weiter dort geöffnet
      if (leaf && leaf.parent && noteLeafMode.current !== mode) {
        leaf.detach();
        leaf = null;
      }
      if (!leaf || !leaf.parent) {
        leaf = app.workspace.getLeaf(mode);
        noteLeafRef.current = leaf;
        noteLeafMode.current = mode;
      }
      await leaf.openFile(file);
    },
    [app, plugin]
  );

  const handleOpen = useCallback(
    async (n: number) => {
      try {
        const file = await ensureWeekFile(n, {});
        await openInSplit(file);
        setQuickEdit(null);
        setDayPanelN(null);
      } catch (e) {
        new Notice(t("errOpen", { err: String(e) }));
      }
    },
    [ensureWeekFile, openInSplit]
  );

  const handleOpenDay = useCallback(
    async (iso: string) => {
      try {
        const existing = dailyIdx[iso];
        let file = existing ? getFile(app, existing.path) : null;
        if (!file) {
          if (!getFolder(app, dailyPath)) await app.vault.createFolder(dailyPath);
          file = await app.vault.create(
            `${dailyPath}/${dailyFilename(iso, null)}`,
            buildDailyContent(iso, null, "", "")
          );
        }
        await openInSplit(file);
        setDayPanelN(null);
      } catch (e) {
        new Notice(t("errOpenDay", { err: String(e) }));
      }
    },
    [app, dailyIdx, dailyPath, openInSplit]
  );

  // ── Multi-Select: Drag-Logik (Port aus der Browser-App) ──────────
  const handleCellDown = useCallback(
    (n: number) => {
      isDragging.current = true;
      dragStartN.current = n;
      dragBaseSelection.current = new Set(selectedWeeks);
      const willSelect = !selectedWeeks.has(n);
      dragAction.current = willSelect ? "select" : "deselect";
      setSelectedWeeks((prev) => {
        const next = new Set(prev);
        if (willSelect) next.add(n);
        else next.delete(n);
        return next;
      });
    },
    [selectedWeeks]
  );

  const handleCellEnter = useCallback((n: number) => {
    if (!isDragging.current) return;
    const start = dragStartN.current;
    const startRow = Math.floor(start / 52);
    const endRow = Math.floor(n / 52);
    const selecting = dragAction.current === "select";

    setSelectedWeeks(() => {
      const next = new Set(dragBaseSelection.current);
      const setOp = (i: number) => (selecting ? next.add(i) : next.delete(i));
      if (endRow === startRow) {
        const lo = Math.min(start, n);
        const hi = Math.max(start, n);
        for (let i = lo; i <= hi; i++) setOp(i);
      } else if (endRow > startRow) {
        for (let i = start; i < (startRow + 1) * 52; i++) setOp(i);
        for (let r = startRow + 1; r < endRow; r++) for (let i = r * 52; i < (r + 1) * 52; i++) setOp(i);
        for (let i = endRow * 52; i <= n; i++) setOp(i);
      } else {
        for (let i = startRow * 52; i <= start; i++) setOp(i);
        for (let r = endRow + 1; r < startRow; r++) for (let i = r * 52; i < (r + 1) * 52; i++) setOp(i);
        for (let i = n; i < (endRow + 1) * 52; i++) setOp(i);
      }
      return next;
    });
  }, []);

  const toggleMultiSelect = useCallback(() => {
    setMultiSelectMode((m) => !m);
    setSelectedWeeks(new Set());
    setQuickEdit(null);
  }, []);

  const handleZoomDelta = useCallback((delta: number) => {
    setNormalZoom(false);
    setZoom((z) => Math.max(0, Math.min(100, z + delta)));
  }, []);

  // ── Ansichts-Modus: Fensterbreite → Fensterhöhe → Normalgröße ────
  const zoomMode = normalZoom ? "normal" : zoom === 50 ? "width" : zoom === 0 ? "height" : "free";
  const nextZoomMode = zoomMode === "width" ? "height" : zoomMode === "height" ? "normal" : "width";
  const cycleZoomMode = useCallback(() => {
    if (nextZoomMode === "height") {
      setNormalZoom(false);
      setZoom(0);
    } else if (nextZoomMode === "normal") {
      setNormalZoom(true);
    } else {
      setNormalZoom(false);
      setZoom(50);
    }
  }, [nextZoomMode]);

  // ── Datumsbereich → Mehrfachauswahl (Port aus der Browser-App) ───
  const applyDateRange = useCallback(
    (fromStr: string, toStr: string) => {
      const from = new Date(fromStr).getTime();
      const to = new Date(toStr).getTime();
      if (!fromStr || !toStr || from > to) return;
      const total = lifeExpectancy * 52;
      const toAdd = new Set<number>();
      for (let n = 0; n < total; n++) {
        const wStart = weekStartDate(bd, n);
        const wEnd = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 6);
        if (wStart.getTime() <= to && wEnd.getTime() >= from) toAdd.add(n);
      }
      if (toAdd.size === 0) return;
      setMultiSelectMode(true);
      setSelectedWeeks((prev) => new Set([...prev, ...toAdd]));
      setShowDateRange(false);
    },
    [bd, lifeExpectancy]
  );

  // ── Bulk-Edit: Farbe/Titel/Inhalt auf alle markierten Wochen ─────
  const applyBulk = useCallback(
    async (color: string | null, title: string, content: string) => {
      const isEmpty = !content.trim() && !color;
      let saved = 0;
      try {
        const folderPath = await ensureFolder();
        for (const n of selectedWeeks) {
          const existing = weeksData[weekKey(bd, n)];
          const existingFile = existing ? getFile(app, existing.path) : null;
          if (isEmpty) {
            if (existingFile) await app.fileManager.trashFile(existingFile);
            saved++;
            continue;
          }
          const fn = weekFilename(bd, n, title);
          const fileContent = buildWeekFileContent(weekLabel(bd, n), color, title, content);
          if (existingFile) {
            await app.vault.modify(existingFile, fileContent);
            if (existingFile.name !== fn && existingFile.parent) {
              await app.fileManager.renameFile(existingFile, `${existingFile.parent.path}/${fn}`);
            }
          } else {
            await app.vault.create(`${folderPath}/${fn}`, fileContent);
          }
          saved++;
        }
        new Notice(isEmpty ? t("bulkDeleted", { n: saved }) : t("bulkSaved", { n: saved }));
      } catch (e) {
        new Notice(t("bulkError", { n: saved, err: String(e) }));
      }
      setSelectedWeeks(new Set());
    },
    [app, bd, ensureFolder, selectedWeeks, weeksData]
  );

  // ── Neuen Tab anlegen (= Ordner unter "Weekly basis/") ───────────
  const handleAddTab = useCallback(async () => {
    const name = newTabName.trim().replace(/[\\/:*?"<>|]/g, "-");
    setAddingTab(false);
    setNewTabName("");
    if (!name) return;
    try {
      const path = `${weeklyBasisPath(settings.basePath)}/${name}`;
      if (!getFolder(app, path)) await app.vault.createFolder(path);
      setActiveTabName(name);
    } catch (e) {
      new Notice(t("errTab", { err: String(e) }));
    }
  }, [app, newTabName, settings.basePath]);

  // ── Tab-Settings ──────────────────────────────────────────────────
  const handleTabConfigSave = useCallback(
    (changes: TabConfig) => {
      if (!tab) return;
      settings.tabConfigs[tab.name] = { ...settings.tabConfigs[tab.name], ...changes };
      void plugin.saveSettings();
      setSettingsV((v) => v + 1);
    },
    [plugin, settings, tab]
  );

  // ── Rendering ─────────────────────────────────────────────────────
  if (!settings.birthDate) {
    return <SetupScreen plugin={plugin} onDone={() => setSettingsV((v) => v + 1)} />;
  }

  const age = actualAge(settings.birthDate);

  return (
    <div className="lw-app">
      <div className="lw-header">
        <span className="lw-title">
          {t("appTitle")}
          {settings.userName ? ` – ${settings.userName}` : ""}
        </span>
        <span className="lw-age">{t("age", { years: age.years, weeks: age.weeks })}</span>
        <button
          className={`lw-ms-toggle ${multiSelectMode ? "active" : ""}`}
          onClick={toggleMultiSelect}
          title={t("multiSelectTitle")}
        >
          {t("multiSelect")}
        </button>
        <button className="lw-ms-toggle" onClick={() => setShowDateRange(true)} title={t("dateRangeTitle")}>
          {t("dateRangeBtn")}
        </button>
        <input
          type="range"
          className="lw-zoom"
          min={0}
          max={100}
          value={zoom}
          onChange={(e) => {
            setNormalZoom(false);
            setZoom(Number(e.target.value));
          }}
          title={t("zoomTitle")}
        />
        <button
          className="lw-ms-toggle lw-zoom-mode"
          onClick={cycleZoomMode}
          title={t("zoomModeTitle", {
            next: t(
              nextZoomMode === "height"
                ? "zoomModeHeight"
                : nextZoomMode === "normal"
                  ? "zoomModeNormal"
                  : "zoomModeWidth"
            ),
          })}
        >
          {nextZoomMode === "height" ? "↕" : nextZoomMode === "normal" ? "1:1" : "↔"}
        </button>
      </div>

      <div className="lw-tabbar">
        {tabs.map((t2) => {
          const hasOwnAxis = !!settings.tabConfigs[t2.name]?.birthDate;
          const isActive = t2.name === tab?.name;
          return (
            <button
              key={t2.name}
              className={`lw-tab ${isActive ? "active" : ""}`}
              onClick={() => {
                if (isActive) return;
                setActiveTabName(t2.name);
                setQuickEdit(null);
                setSelectedWeeks(new Set());
              }}
            >
              {t2.name}
              {hasOwnAxis && <span title={t("ownAxis")}> ·</span>}
              {isActive && (
                <span
                  className="lw-tab-gear"
                  title={t("tabSettingsTitle")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTabSettings(true);
                  }}
                >
                  ⚙
                </span>
              )}
            </button>
          );
        })}
        {addingTab ? (
          <input
            className="lw-tab-input"
            autoFocus
            placeholder={t("newTabPlaceholder")}
            value={newTabName}
            onChange={(e) => setNewTabName(e.target.value)}
            onBlur={() => void handleAddTab()}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAddTab();
              if (e.key === "Escape") {
                setAddingTab(false);
                setNewTabName("");
              }
            }}
          />
        ) : (
          <button className="lw-tab lw-tab-add" title={t("addTabTitle")} onClick={() => setAddingTab(true)}>
            +
          </button>
        )}
        {tabs.length === 0 && (
          <span className="lw-muted">{t("noTabs", { path: settings.basePath })}</span>
        )}
      </div>

      <WeekGrid
        birthDate={bd}
        lifeExpectancy={lifeExpectancy}
        weeksData={weeksData}
        dailyIdx={dailyIdx}
        zoomLevel={zoom}
        normalZoom={normalZoom}
        showMilestones={showMilestones}
        legend={legend}
        onLegendChange={handleLegendChange}
        multiSelectMode={multiSelectMode}
        selectedWeeks={selectedWeeks}
        onZoomDelta={handleZoomDelta}
        onCellClick={(n, x, y) => {
          // Woche mit vorhandener Notiz: kurzer Klick öffnet sie direkt;
          // Farbe/Titel nachträglich per Rechtsklick oder Long-Press
          if (weeksData[weekKey(bd, n)]) void handleOpen(n);
          else setQuickEdit({ n, x, y });
        }}
        onCellContext={(n, x, y) => setQuickEdit({ n, x, y })}
        onCellDown={handleCellDown}
        onCellEnter={handleCellEnter}
        onLongPress={(n) => setDayPanelN(n)}
      />

      {multiSelectMode && selectedWeeks.size > 0 && (
        <BulkActionBar
          count={selectedWeeks.size}
          onApply={applyBulk}
          onClear={() => setSelectedWeeks(new Set())}
        />
      )}

      {quickEdit && (
        <WeekQuickEdit
          n={quickEdit.n}
          x={quickEdit.x}
          y={quickEdit.y}
          birthDate={bd}
          data={weeksData[weekKey(bd, quickEdit.n)] ?? null}
          onColor={(n, color) => void handleColor(n, color)}
          onTitle={(n, title) => void handleTitle(n, title)}
          onOpen={(n) => void handleOpen(n)}
          onClose={() => setQuickEdit(null)}
        />
      )}

      {dayPanelN !== null && (
        <DayPanel
          n={dayPanelN}
          birthDate={bd}
          weeksData={weeksData}
          dailyIdx={dailyIdx}
          onOpenDay={(iso) => void handleOpenDay(iso)}
          onOpenWeek={(n) => void handleOpen(n)}
          onWeekColor={(n, color) => void handleColor(n, color)}
          onWeekTitle={(n, title) => void handleTitle(n, title)}
          onClose={() => setDayPanelN(null)}
        />
      )}

      {showDateRange && (
        <DateRangeModal onApply={applyDateRange} onClose={() => setShowDateRange(false)} />
      )}

      {showTabSettings && tab && (
        <TabSettingsModal
          tabName={tab.name}
          config={tabConfig}
          globalBirthDate={settings.birthDate}
          globalLifeExpectancy={settings.lifeExpectancy}
          onSave={handleTabConfigSave}
          onClose={() => setShowTabSettings(false)}
        />
      )}
    </div>
  );
}
