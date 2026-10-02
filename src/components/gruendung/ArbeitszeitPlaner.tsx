'use client';

import { useEffect, useMemo, useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Check, CalendarDays, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  ROADMAP_VORLAGE,
  KATEGORIE_FARBE,
  DEFAULT_STUNDEN,
  WOCHENTAGE,
  type RoadmapKategorie,
} from '@/lib/gruendung-roadmap';

interface PlanerTask {
  id: string;
  title: string;
  category: RoadmapKategorie;
  effortH: number;
  done: boolean;
}

interface Stored {
  configured: boolean;
  hours: number[];
  tasks: PlanerTask[];
}

const STORAGE_KEY = 'gs-planer-v1';
const KATEGORIEN: RoadmapKategorie[] = ['Bürokratie', 'Methode', 'Website'];

function seedTasks(): PlanerTask[] {
  return ROADMAP_VORLAGE.map((t) => ({ ...t, done: false }));
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return 't' + Date.now() + Math.floor(Math.random() * 1000);
}

interface DayPlan {
  date: Date;
  items: { id: string; title: string; category: RoadmapKategorie; h: number }[];
}

function computeSchedule(tasks: PlanerTask[], hours: number[]) {
  const open = tasks.filter((t) => !t.done && t.effortH > 0);
  const weekly = hours.reduce((a, b) => a + (b || 0), 0);
  const days: DayPlan[] = [];
  const taskFinish: Record<string, Date> = {};
  if (weekly <= 0 || open.length === 0) {
    return { days, taskFinish, finishDate: null as Date | null, weekly };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const queue = open.map((t) => ({ ...t, rem: t.effortH }));
  let qi = 0;
  let offset = 0;
  let safety = 0;

  while (qi < queue.length && safety < 750) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const wd = (date.getDay() + 6) % 7; // Mo=0 … So=6
    let cap = hours[wd] || 0;
    const items: DayPlan['items'] = [];
    while (cap > 0.0001 && qi < queue.length) {
      const t = queue[qi];
      const use = Math.min(cap, t.rem);
      t.rem -= use;
      cap -= use;
      items.push({ id: t.id, title: t.title, category: t.category, h: use });
      if (t.rem <= 0.0001) {
        taskFinish[t.id] = date;
        qi++;
      }
    }
    if (items.length) days.push({ date, items });
    offset++;
    safety++;
  }
  const finishDate = days.length ? days[days.length - 1].date : null;
  return { days, taskFinish, finishDate, weekly };
}

const fmtDay = (d: Date) =>
  d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
const fmtFull = (d: Date) =>
  d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

function CatBadge({ category }: { category: RoadmapKategorie }) {
  const c = KATEGORIE_FARBE[category];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.06em]"
      style={{ color: c, background: `${c}1A`, border: `1px solid ${c}40` }}
    >
      {category}
    </span>
  );
}

export default function ArbeitszeitPlaner() {
  const [loaded, setLoaded] = useState(false);
  const [maskOpen, setMaskOpen] = useState(false);
  const [hours, setHours] = useState<number[]>(DEFAULT_STUNDEN);
  const [tasks, setTasks] = useState<PlanerTask[]>(seedTasks);

  // Neue-Aufgabe-Formular
  const [ntTitle, setNtTitle] = useState('');
  const [ntCat, setNtCat] = useState<RoadmapKategorie>('Website');
  const [ntEffort, setNtEffort] = useState('2');

  // Laden
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Stored;
        if (Array.isArray(data.hours) && data.hours.length === 7) setHours(data.hours);
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (!data.configured) setMaskOpen(true);
      } else {
        setMaskOpen(true); // Erstaufruf → Maske öffnet automatisch
      }
    } catch {
      setMaskOpen(true);
    }
    setLoaded(true);
  }, []);

  // Speichern (auto)
  useEffect(() => {
    if (!loaded) return;
    const data: Stored = { configured: !maskOpen, hours, tasks };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* noop */
    }
  }, [loaded, maskOpen, hours, tasks]);

  const schedule = useMemo(() => computeSchedule(tasks, hours), [tasks, hours]);

  const openTasks = tasks.filter((t) => !t.done);
  const totalOpenH = openTasks.reduce((a, t) => a + (t.effortH || 0), 0);
  const weekly = hours.reduce((a, b) => a + (b || 0), 0);

  function toggleDone(id: string) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function setEffort(id: string, v: number) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, effortH: Math.max(0, v) } : t)));
  }
  function removeTask(id: string) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  }
  function addTask() {
    const title = ntTitle.trim();
    const effortH = parseFloat(ntEffort.replace(',', '.'));
    if (!title || !Number.isFinite(effortH) || effortH <= 0) return;
    setTasks((ts) => [...ts, { id: newId(), title, category: ntCat, effortH, done: false }]);
    setNtTitle('');
    setNtEffort('2');
  }
  function resetVorlage() {
    setTasks(seedTasks());
  }

  if (!loaded) {
    return <div className="py-12 text-center font-body text-text-muted">Lade Planer …</div>;
  }

  return (
    <div className="space-y-8">
      {/* Maske — Werte aus RecipeSubmitModal (Feder, Ausgang kuerzer als Eingang) und
          ExitIntent (scale 0.97). Bei prefers-reduced-motion nimmt MotionConfig
          (MotionProvider) die Verschiebung und Skalierung weg, die Deckkraft bleibt. */}
      <AnimatePresence>
        {maskOpen && (
          <motion.div
            key="maske-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-lg rounded-sm border border-border-subtle bg-surface-base p-6 shadow-xl"
            >
              <div className="mb-1 flex items-center gap-2">
                <Clock size={18} className="text-brand-fire" />
                <h2 className="font-serif text-xl text-text-primary">Wie viel Zeit hast du?</h2>
              </div>
              <p className="mb-5 font-body text-[0.9rem] leading-relaxed text-text-secondary">
                Trag ein, wie viele Stunden du an jedem Wochentag realistisch fürs Projekt aufbringen
                kannst. Daraus baut der Planer deinen Timetable — und rechnet automatisch neu, sobald
                du Aufgaben abhakst oder ergänzt.
              </p>
              <div className="mb-6 grid grid-cols-7 gap-2">
                {WOCHENTAGE.map((wd, i) => (
                  <label key={wd} className="flex flex-col items-center gap-1">
                    <span className="font-sans text-[11px] font-bold uppercase text-text-muted">{wd}</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={hours[i]}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setHours((h) => h.map((x, j) => (j === i ? (Number.isFinite(v) ? v : 0) : x)));
                      }}
                      className="w-full rounded-sm border border-border-subtle bg-surface-elevated px-1 py-1.5 text-center font-sans text-sm text-text-primary focus:border-brand-fire"
                    />
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-[0.85rem] text-text-muted">
                  {weekly} Std./Woche
                </span>
                <button
                  onClick={() => setMaskOpen(false)}
                  className="rounded-sm bg-brand-fire px-5 py-2 font-sans text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Timetable bauen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">Offen</div>
          <div className="mt-1 font-serif text-2xl text-text-primary">
            {openTasks.length} Aufgaben · {totalOpenH} Std.
          </div>
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">Verfügbar</div>
          <div className="mt-1 font-serif text-2xl text-text-primary">{weekly} Std./Woche</div>
        </div>
        <div className="rounded-sm border border-border-subtle p-4" style={{ borderColor: '#C8882A66', background: '#C8882A0F' }}>
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: '#C8882A' }}>Fertig am</div>
          <div className="mt-1 font-serif text-2xl text-text-primary">
            {schedule.finishDate ? fmtFull(schedule.finishDate) : '—'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setMaskOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-elevated px-4 py-2 font-sans text-sm font-semibold text-text-primary transition-colors hover:border-brand-fire"
        >
          <Clock size={15} /> Zeiten ändern
        </button>
        <button
          onClick={resetVorlage}
          className="inline-flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-elevated px-4 py-2 font-sans text-sm font-semibold text-text-muted transition-colors hover:text-text-primary"
        >
          <RefreshCw size={15} /> Vorlage zurücksetzen
        </button>
      </div>

      {weekly <= 0 && (
        <div
          className="flex items-center gap-2 rounded-sm border-l-[3px] py-3 pl-4 pr-4 font-body text-sm text-text-secondary"
          style={{ borderLeftColor: '#E85018', background: '#E850180F' }}
        >
          <AlertTriangle size={16} style={{ color: '#E85018' }} className="shrink-0" />
          Keine Zeit eingetragen — trag oben unter „Zeiten ändern&quot; deine verfügbaren Stunden ein.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Aufgaben */}
        <section>
          <h2 className="mb-4 font-serif text-xl text-text-primary">Deine Aufgaben</h2>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-sm border border-border-subtle bg-surface-elevated p-3"
              >
                <button
                  onClick={() => toggleDone(t.id)}
                  aria-label="erledigt"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border"
                  style={{
                    borderColor: t.done ? '#C8882A' : '#8884',
                    background: t.done ? '#C8882A' : 'transparent',
                  }}
                >
                  {t.done && <Check size={13} className="text-white" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`font-body text-[0.92rem] ${t.done ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                    {t.title}
                  </div>
                  <div className="mt-1">
                    <CatBadge category={t.category} />
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={t.effortH}
                  onChange={(e) => setEffort(t.id, parseFloat(e.target.value) || 0)}
                  className="w-14 rounded-sm border border-border-subtle bg-surface-base px-1 py-1 text-center font-sans text-sm text-text-primary focus:border-brand-fire"
                  aria-label="Stunden"
                />
                <span className="font-sans text-[11px] text-text-muted">Std.</span>
                <button onClick={() => removeTask(t.id)} aria-label="löschen" className="text-text-muted hover:text-brand-fire">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>

          {/* Neue Aufgabe */}
          <div className="mt-4 rounded-sm border border-dashed border-border-subtle p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={ntTitle}
                onChange={(e) => setNtTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Neue Aufgabe …"
                className="min-w-0 flex-1 rounded-sm border border-border-subtle bg-surface-base px-3 py-1.5 font-body text-sm text-text-primary focus:border-brand-fire"
              />
              <select
                value={ntCat}
                onChange={(e) => setNtCat(e.target.value as RoadmapKategorie)}
                className="rounded-sm border border-border-subtle bg-surface-base px-2 py-1.5 font-sans text-sm text-text-primary focus:border-brand-fire"
              >
                {KATEGORIEN.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={ntEffort}
                onChange={(e) => setNtEffort(e.target.value)}
                className="w-16 rounded-sm border border-border-subtle bg-surface-base px-2 py-1.5 text-center font-sans text-sm text-text-primary focus:border-brand-fire"
                aria-label="Stunden"
              />
              <button
                onClick={addTask}
                className="inline-flex items-center gap-1 rounded-sm bg-brand-fire px-3 py-1.5 font-sans text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </section>

        {/* Timetable */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-brand-fire" />
            <h2 className="font-serif text-xl text-text-primary">Dein Timetable</h2>
          </div>
          {schedule.days.length === 0 ? (
            <p className="font-body text-sm text-text-muted">
              Sobald Zeit + offene Aufgaben da sind, erscheint hier dein Tagesplan.
            </p>
          ) : (
            <ol className="space-y-2">
              {schedule.days.slice(0, 28).map((d) => (
                <li key={d.date.toISOString()} className="rounded-sm border border-border-subtle bg-surface-elevated p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-sans text-[0.85rem] font-bold text-text-primary">{fmtDay(d.date)}</span>
                    <span className="font-sans text-[11px] text-text-muted">
                      {d.items.reduce((a, x) => a + x.h, 0)} Std.
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {d.items.map((it, k) => (
                      <li key={it.id + k} className="flex items-center gap-2 font-body text-[0.85rem] text-text-secondary">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: KATEGORIE_FARBE[it.category] }}
                        />
                        <span className="min-w-0 flex-1 truncate">{it.title}</span>
                        <span className="shrink-0 font-sans text-[11px] text-text-muted">{it.h} h</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              {schedule.days.length > 28 && (
                <li className="px-1 py-2 font-body text-[0.82rem] italic text-text-muted">
                  … weitere {schedule.days.length - 28} Tage bis zum {schedule.finishDate ? fmtFull(schedule.finishDate) : ''}.
                  Mehr Zeit/Woche eintragen verkürzt das deutlich.
                </li>
              )}
            </ol>
          )}
        </section>
      </div>

      <p className="font-body text-[0.8rem] italic leading-relaxed text-text-muted">
        Dein Plan wird nur in diesem Browser gespeichert (kein Konto nötig) und aktualisiert sich
        automatisch, wenn du Aufgaben abhakst, Aufwände änderst oder neue ergänzt. Aufwands-Schätzungen
        sind Richtwerte — passe sie an deine Realität an.
      </p>
    </div>
  );
}
