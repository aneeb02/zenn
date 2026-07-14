'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/zen-dark.css';

interface Habit {
  id: string;
  name: string;
  cadence: string;
  targetDays: number;
  color: string;
  doneToday: boolean;
  streak: number;
  last7: boolean[];
  weekCount: number;
}

const COLOR_TOKENS: Record<string, string> = {
  moss: 'var(--moss-green)',
  ocean: 'var(--ocean-blue)',
  sakura: 'var(--sakura-pink)',
  amber: 'var(--amber-glow)',
  twilight: 'var(--twilight-purple)',
};
const COLOR_ORDER = ['moss', 'ocean', 'sakura', 'amber', 'twilight'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function ZenHabitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [newName, setNewName] = useState('');
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);

  const fetchHabits = useCallback(async () => {
    try {
      const response = await fetch('/api/habits', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setHabits(data.habits || []);
      }
    } catch {
      // keep current list
    } finally {
      setIsLoadingHabits(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchHabits();
  }, [user, fetchHabits]);

  const addHabit = async () => {
    const name = newName.trim();
    if (!name) return;
    setNewName('');
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, color: COLOR_ORDER[habits.length % COLOR_ORDER.length] }),
      });
      if (!response.ok) throw new Error('failed');
      await fetchHabits();
    } catch {
      toast.error('Could not add that habit.');
      setNewName(name);
    }
  };

  const toggleToday = async (habit: Habit) => {
    // optimistic
    setHabits((current) =>
      current.map((h) =>
        h.id === habit.id
          ? { ...h, doneToday: !h.doneToday, streak: h.doneToday ? Math.max(0, h.streak - 1) : h.streak + 1 }
          : h
      )
    );
    try {
      const response = await fetch(`/api/habits/${habit.id}/toggle`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('failed');
      await fetchHabits(); // reconcile streak / last7 exactly
    } catch {
      toast.error('Could not update that habit.');
      fetchHabits();
    }
  };

  const cycleColor = async (habit: Habit) => {
    const next = COLOR_ORDER[(COLOR_ORDER.indexOf(habit.color) + 1) % COLOR_ORDER.length];
    setHabits((current) => current.map((h) => (h.id === habit.id ? { ...h, color: next } : h)));
    try {
      await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ color: next }),
      });
    } catch {
      fetchHabits();
    }
  };

  const deleteHabit = async (id: string) => {
    const previous = habits;
    setHabits((current) => current.filter((h) => h.id !== id));
    try {
      const response = await fetch(`/api/habits/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error('failed');
    } catch {
      toast.error('Could not delete that habit.');
      setHabits(previous);
    }
  };

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

  const doneToday = habits.filter((h) => h.doneToday).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative' }}>
      <div className="zen-circle" style={{ top: '12%', right: '7%', width: '120px', height: '120px' }} />
      <div className="zen-circle imperfect" style={{ bottom: '14%', left: '5%', width: '90px', height: '90px' }} />

      <nav style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Link href="/dashboard">
          <button className="zen-button">← back</button>
        </Link>
        {habits.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>today</span>
            <span style={{ color: 'var(--moss-green)', fontWeight: 500 }}>{doneToday}/{habits.length}</span>
          </div>
        )}
      </nav>

      <main className="zen-container" style={{ marginTop: 'var(--space-lg)', maxWidth: '720px' }}>
        <section style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-sm)' }}>
            small things, kept
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            gentle daily rhythms. showing up matters more than perfection.
          </p>
        </section>

        {/* Quick add */}
        <section className="zen-card" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addHabit();
                }
              }}
              placeholder="add a habit... (e.g. read, stretch, meditate)"
              style={{
                minWidth: 0,
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-primary)',
                padding: '0 0 var(--space-sm)',
                outline: 'none',
                fontSize: '1rem',
                fontFamily: 'var(--font-sans)',
              }}
            />
            <button className="zen-button" onClick={addHabit} style={{ padding: '8px 16px' }}>
              add
            </button>
          </div>
        </section>

        {isLoadingHabits ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>gathering your rhythms...</p>
        ) : habits.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            no habits yet. start with one small thing you&apos;d like to return to each day.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {habits.map((habit) => {
              const color = COLOR_TOKENS[habit.color] || COLOR_TOKENS.moss;
              return (
                <div
                  key={habit.id}
                  className="zen-card"
                  style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}
                >
                  {/* Color swatch (click to recolor) */}
                  <button
                    onClick={() => cycleColor(habit)}
                    aria-label="change colour"
                    style={{ width: '12px', height: '12px', flexShrink: 0, borderRadius: '50%', border: 'none', background: color, cursor: 'pointer', padding: 0 }}
                  />

                  {/* Name + streak */}
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '2px' }}>{habit.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {habit.streak > 0 ? `🔥 ${habit.streak} day${habit.streak === 1 ? '' : 's'}` : 'start today'}
                    </p>
                  </div>

                  {/* Last 7 days */}
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    {habit.last7.map((done, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <div
                          title={done ? 'done' : 'missed'}
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '4px',
                            background: done ? color : 'transparent',
                            opacity: done ? 0.85 : 1,
                            boxShadow: done ? 'none' : 'inset 0 0 0 1px var(--border-subtle)',
                          }}
                        />
                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{DAY_LETTERS[(new Date().getDay() - 6 + i + 7) % 7]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Today toggle */}
                  <button
                    onClick={() => toggleToday(habit)}
                    aria-label={habit.doneToday ? 'mark not done today' : 'mark done today'}
                    style={{
                      width: '40px',
                      height: '40px',
                      flexShrink: 0,
                      borderRadius: '50%',
                      border: `1px solid ${habit.doneToday ? color : 'var(--border-subtle)'}`,
                      background: habit.doneToday ? color : 'transparent',
                      color: habit.doneToday ? 'var(--ink-black)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      lineHeight: 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {habit.doneToday ? '✓' : '○'}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    aria-label="delete habit"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
