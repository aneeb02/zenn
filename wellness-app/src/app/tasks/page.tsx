'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/zen-dark.css';

type TaskStatus = 'todo' | 'doing' | 'done';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: number;
  spentMins: number;
  estimateMins: number | null;
  createdAt: string;
}

const PRIORITY_META: Record<number, { label: string; color: string }> = {
  0: { label: 'no priority', color: 'var(--text-muted)' },
  1: { label: 'low', color: 'var(--ocean-blue)' },
  2: { label: 'medium', color: 'var(--amber-glow)' },
  3: { label: 'high', color: 'var(--sakura-pink)' },
};

const SECTIONS: { status: TaskStatus; label: string }[] = [
  { status: 'doing', label: 'in focus' },
  { status: 'todo', label: 'to do' },
  { status: 'done', label: 'done' },
];

export default function ZenTasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // leave existing list in place
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;

    setNewTitle('');
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      setTasks((current) => [data.task, ...current]);
    } catch {
      toast.error('Could not add that task.');
      setNewTitle(title);
    }
  };

  const patchTask = async (id: string, changes: Partial<Task>) => {
    // optimistic update
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...changes } : task))
    );
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      setTasks((current) => current.map((task) => (task.id === id ? data.task : task)));
    } catch {
      toast.error('Could not save that change.');
      fetchTasks();
    }
  };

  const toggleDone = (task: Task) => {
    patchTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  const cyclePriority = (task: Task) => {
    patchTask(task.id, { priority: (task.priority + 1) % 4 });
  };

  const deleteTask = async (id: string) => {
    const previous = tasks;
    setTasks((current) => current.filter((task) => task.id !== id));
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('failed');
    } catch {
      toast.error('Could not delete that task.');
      setTasks(previous);
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

  const activeCount = tasks.filter((t) => t.status !== 'done').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative' }}>
      <div className="zen-circle" style={{ top: '12%', right: '7%', width: '120px', height: '120px' }} />
      <div className="zen-circle imperfect" style={{ bottom: '14%', left: '5%', width: '90px', height: '90px' }} />

      <nav style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Link href="/dashboard">
          <button className="zen-button">← back</button>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>open</span>
          <span style={{ color: 'var(--sakura-pink)', fontWeight: 500 }}>{activeCount}</span>
        </div>
      </nav>

      <main className="zen-container" style={{ marginTop: 'var(--space-lg)', maxWidth: '720px' }}>
        <section style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-sm)' }}>
            what needs your focus?
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            name the work, then give it a quiet block. one thing at a time.
          </p>
        </section>

        {/* Quick add */}
        <section className="zen-card" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTask();
                }
              }}
              placeholder="add a task..."
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
            <button className="zen-button" onClick={addTask} style={{ padding: '8px 16px' }}>
              add
            </button>
          </div>
        </section>

        {isLoadingTasks ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>gathering your tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            nothing here yet. a clear list is a calm mind.
          </p>
        ) : (
          SECTIONS.map(({ status, label }) => {
            const items = tasks.filter((task) => task.status === status);
            if (items.length === 0) return null;

            return (
              <section key={status} style={{ marginBottom: 'var(--space-lg)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-sm)' }}>
                  {label} · {items.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((task) => {
                    const isDone = task.status === 'done';
                    const priority = PRIORITY_META[task.priority] ?? PRIORITY_META[0];
                    return (
                      <div
                        key={task.id}
                        className="zen-card"
                        style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                      >
                        {/* Done toggle */}
                        <button
                          onClick={() => toggleDone(task)}
                          aria-label={isDone ? 'mark as not done' : 'mark as done'}
                          style={{
                            width: '20px',
                            height: '20px',
                            flexShrink: 0,
                            borderRadius: '50%',
                            border: `1px solid ${isDone ? 'var(--playful-mint)' : 'var(--border-subtle)'}`,
                            background: isDone ? 'rgba(168, 213, 186, 0.2)' : 'transparent',
                            color: 'var(--playful-mint)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            lineHeight: 1,
                          }}
                        >
                          {isDone ? '✓' : ''}
                        </button>

                        {/* Priority dot */}
                        <button
                          onClick={() => cyclePriority(task)}
                          aria-label={`priority: ${priority.label}`}
                          title={priority.label}
                          style={{
                            width: '10px',
                            height: '10px',
                            flexShrink: 0,
                            borderRadius: '50%',
                            border: 'none',
                            background: task.priority === 0 ? 'transparent' : priority.color,
                            boxShadow: task.priority === 0 ? `inset 0 0 0 1px var(--border-subtle)` : 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />

                        {/* Title */}
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                            fontSize: '0.95rem',
                            textDecoration: isDone ? 'line-through' : 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.title}
                        </span>

                        {/* Spent time */}
                        {task.spentMins > 0 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', flexShrink: 0 }}>
                            {task.spentMins}m
                          </span>
                        )}

                        {/* Focus link */}
                        {!isDone && (
                          <Link href={`/focus?taskId=${task.id}`} style={{ flexShrink: 0 }}>
                            <button className="zen-button" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                              focus
                            </button>
                          </Link>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          aria-label="delete task"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
