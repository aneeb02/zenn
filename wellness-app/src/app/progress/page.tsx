'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/zen-dark.css';

interface WeekBucket {
  label: string;
  focusMinutes: number;
  sessions: number;
  tasksCompleted: number;
  journalEntries: number;
}

interface HourBucket {
  hour: number;
  minutes: number;
  sessions: number;
}

interface ProgressData {
  rangeDays: number;
  summary: {
    totalFocusMinutes: number;
    totalSessions: number;
    totalTasksCompleted: number;
    totalJournalEntries: number;
    bestFocusHour: number | null;
    bestFocusMinutes: number;
  };
  weeks: WeekBucket[];
  focusByHour: HourBucket[];
  moods: { mood: string; count: number }[];
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊',
  calm: '🍵',
  anxious: '🌊',
  sad: '🌧️',
  energetic: '⚡',
  grateful: '🙏',
  frustrated: '🌋',
  hopeful: '🌱',
  neutral: '○',
};

function formatMinutes(mins: number): string {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatHour(hour: number): string {
  const period = hour < 12 ? 'am' : 'pm';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${period}`;
}

/** Vertical bar chart built from divs — single sequential hue, 4px rounded tops. */
function BarChart({
  bars,
  color,
  height = 140,
  peakIndex,
}: {
  bars: { label: string; value: number; tooltip: string }[];
  color: string;
  height?: number;
  peakIndex?: number;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height }}>
      {bars.map((bar, i) => {
        const barHeight = bar.value > 0 ? Math.max(3, (bar.value / max) * (height - 22)) : 0;
        const isPeak = peakIndex === i && bar.value > 0;
        return (
          <div
            key={i}
            className="pg-bar-col"
            title={bar.tooltip}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}
          >
            <span
              style={{
                fontSize: '0.6rem',
                color: isPeak ? color : 'var(--text-muted)',
                marginBottom: '3px',
                opacity: bar.value > 0 ? 1 : 0,
                whiteSpace: 'nowrap',
              }}
            >
              {bar.value > 0 && isPeak ? bar.label.split(' ')[0] : ''}
            </span>
            <div
              className="pg-bar"
              style={{
                width: '100%',
                maxWidth: '28px',
                height: barHeight,
                background: color,
                opacity: isPeak ? 1 : 0.55,
                borderRadius: '4px 4px 0 0',
                transition: 'opacity 0.2s ease',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function AxisLabels({ labels }: { labels: string[] }) {
  return (
    <div style={{ display: 'flex', gap: '2px', marginTop: '6px' }}>
      {labels.map((label, i) => (
        <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {label}
        </span>
      ))}
    </div>
  );
}

function StatTile({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="zen-card" style={{ padding: 'var(--space-md)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 'var(--space-xs)' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 200, color, lineHeight: 1.1 }}>{value}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{sub}</p>
    </div>
  );
}

function ChartCard({ title, insight, children }: { title: string; insight?: string; children: React.ReactNode }) {
  return (
    <section className="zen-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: insight ? '2px' : 'var(--space-md)' }}>
        {title}
      </h3>
      {insight && <p style={{ color: 'var(--amber-glow)', fontSize: '0.82rem', marginBottom: 'var(--space-md)' }}>{insight}</p>}
      {children}
    </section>
  );
}

export default function ZenProgressPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/progress', { credentials: 'include' });
      if (response.ok) {
        setData(await response.json());
      }
    } catch {
      // leave empty state
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchProgress();
  }, [user, fetchProgress]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="floating">
          <div className="zen-circle imperfect" style={{ position: 'relative', width: '60px', height: '60px', opacity: 0.3 }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasAnyActivity =
    !!data &&
    (data.summary.totalSessions > 0 ||
      data.summary.totalTasksCompleted > 0 ||
      data.summary.totalJournalEntries > 0);

  const maxMood = data ? Math.max(1, ...data.moods.map((m) => m.count)) : 1;
  const peakHourIndex =
    data && data.summary.bestFocusHour !== null
      ? data.focusByHour.findIndex((b) => b.hour === data.summary.bestFocusHour)
      : -1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative' }}>
      <style>{`
        .pg-bar-col:hover .pg-bar { opacity: 1 !important; }
      `}</style>

      <div className="zen-circle" style={{ top: '10%', left: '6%', width: '130px', height: '130px' }} />
      <div className="zen-circle imperfect" style={{ bottom: '12%', right: '8%', width: '90px', height: '90px' }} />

      <nav style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Link href="/dashboard">
          <button className="zen-button">← back</button>
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>last 12 weeks</span>
      </nav>

      <main className="zen-container" style={{ marginTop: 'var(--space-lg)', maxWidth: '820px' }}>
        <section style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-sm)' }}>
            how you&apos;ve been showing up
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            patterns, not pressure. a quiet look at your focus, tasks, and mood.
          </p>
        </section>

        {isLoadingData ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>gathering your patterns...</p>
        ) : !hasAnyActivity ? (
          <div className="zen-card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-md)' }}>
              nothing to reflect on yet. focus on a task or write an entry, and your patterns will appear here.
            </p>
            <Link href="/tasks">
              <button className="zen-button-playful">plan your first task</button>
            </Link>
          </div>
        ) : data ? (
          <>
            {/* Summary tiles */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              <StatTile label="total focus" value={formatMinutes(data.summary.totalFocusMinutes)} sub={`${data.summary.totalSessions} sessions`} color="var(--ocean-blue)" />
              <StatTile label="tasks done" value={String(data.summary.totalTasksCompleted)} sub="completed" color="var(--moss-green)" />
              <StatTile label="reflections" value={String(data.summary.totalJournalEntries)} sub="journal entries" color="var(--twilight-purple)" />
              <StatTile
                label="best window"
                value={data.summary.bestFocusHour !== null ? formatHour(data.summary.bestFocusHour) : '—'}
                sub={data.summary.bestFocusHour !== null ? 'peak focus' : 'not enough data'}
                color="var(--sakura-pink)"
              />
            </section>

            {/* Focus minutes by week */}
            <ChartCard title="focus minutes by week">
              <BarChart
                color="var(--ocean-blue)"
                bars={data.weeks.map((w) => ({
                  label: w.label,
                  value: w.focusMinutes,
                  tooltip: `${w.label}: ${formatMinutes(w.focusMinutes)} · ${w.sessions} sessions`,
                }))}
              />
              <AxisLabels labels={data.weeks.map((w, i) => (i % 2 === 0 ? w.label.split(' ')[0] : ''))} />
            </ChartCard>

            {/* Focus by hour of day */}
            <ChartCard
              title="when you focus"
              insight={
                data.summary.bestFocusHour !== null
                  ? `your deepest focus tends to land around ${formatHour(data.summary.bestFocusHour)}.`
                  : undefined
              }
            >
              <BarChart
                color="var(--sakura-pink)"
                peakIndex={peakHourIndex >= 0 ? peakHourIndex : undefined}
                bars={data.focusByHour.map((h) => ({
                  label: formatHour(h.hour),
                  value: h.minutes,
                  tooltip: `${formatHour(h.hour)}: ${formatMinutes(h.minutes)} · ${h.sessions} sessions`,
                }))}
              />
              <AxisLabels labels={data.focusByHour.map((h) => (h.hour % 6 === 0 ? formatHour(h.hour) : ''))} />
            </ChartCard>

            {/* Tasks completed by week */}
            <ChartCard title="tasks completed by week">
              <BarChart
                color="var(--moss-green)"
                bars={data.weeks.map((w) => ({
                  label: w.label,
                  value: w.tasksCompleted,
                  tooltip: `${w.label}: ${w.tasksCompleted} tasks`,
                }))}
              />
              <AxisLabels labels={data.weeks.map((w, i) => (i % 2 === 0 ? w.label.split(' ')[0] : ''))} />
            </ChartCard>

            {/* Mood distribution */}
            {data.moods.length > 0 && (
              <ChartCard title="how you've felt">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {data.moods.map((m) => (
                    <div key={m.mood} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span style={{ width: '92px', flexShrink: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {MOOD_EMOJI[m.mood] || '·'} {m.mood}
                      </span>
                      <div className="pg-bar-col" title={`${m.mood}: ${m.count}`} style={{ flex: 1, height: '16px', display: 'flex', alignItems: 'center' }}>
                        <div
                          className="pg-bar"
                          style={{
                            width: `${(m.count / maxMood) * 100}%`,
                            minWidth: '4px',
                            height: '10px',
                            background: 'var(--twilight-purple)',
                            opacity: 0.65,
                            borderRadius: '0 4px 4px 0',
                            transition: 'opacity 0.2s ease',
                          }}
                        />
                      </div>
                      <span style={{ width: '28px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {m.count}
                      </span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: 'var(--space-md) 0 var(--space-2xl)' }}>
              hover any bar for detail · times shown in your local hours
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
