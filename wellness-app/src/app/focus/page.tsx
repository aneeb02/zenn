'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import '@/styles/zen-dark.css';

type SessionMode = {
  id: 'deep-work' | 'study-sprint' | 'debug-mode' | 'ship-it' | 'reset-break';
  name: string;
  duration: number;
  emoji: string;
  purpose: string;
  intentionPlaceholder: string;
  completionMessage: string;
  journalPrompt: string;
};

type SessionTask = {
  id: string;
  text: string;
};

type CompletionSummary = {
  mode: SessionMode;
  duration: number;
  intention: string;
  tasks: SessionTask[];
  checkedTaskIds: string[];
};

type DailyStatsResponse = {
  today?: {
    focusSessionsCount?: number;
  };
};

const SESSION_MODES: SessionMode[] = [
  {
    id: 'deep-work',
    name: 'deep work',
    duration: 25,
    emoji: '🎯',
    purpose: 'Protect one quiet block for coding, writing, or hard thinking.',
    intentionPlaceholder: 'What deserves your full attention?',
    completionMessage: 'You protected the block. That counts.',
    journalPrompt: 'What moved forward during this deep work session? What is the next smallest step?',
  },
  {
    id: 'study-sprint',
    name: 'study sprint',
    duration: 30,
    emoji: '📚',
    purpose: 'Work through coursework, revision, or a concept that needs patience.',
    intentionPlaceholder: 'What concept or assignment are you working through?',
    completionMessage: 'Good study is built in honest passes.',
    journalPrompt: 'What did you understand better after this study sprint? What still feels unclear?',
  },
  {
    id: 'debug-mode',
    name: 'debug mode',
    duration: 20,
    emoji: '🧩',
    purpose: 'Slow down, trace the evidence, and isolate one difficult issue.',
    intentionPlaceholder: 'What bug or question are you investigating?',
    completionMessage: 'Careful investigation is progress, even before the fix lands.',
    journalPrompt: 'What did you learn while debugging? What evidence changed your understanding?',
  },
  {
    id: 'ship-it',
    name: 'ship it',
    duration: 45,
    emoji: '🚢',
    purpose: 'Finish a concrete deliverable: commit, deploy, polish, or submit.',
    intentionPlaceholder: 'What are you trying to ship?',
    completionMessage: 'Shipping is a practice. You made the work more real.',
    journalPrompt: 'What did you ship or move closer to shipping? What should happen next?',
  },
  {
    id: 'reset-break',
    name: 'reset break',
    duration: 5,
    emoji: '🍵',
    purpose: 'Step back, breathe, and return without dragging fatigue forward.',
    intentionPlaceholder: 'What do you need to let go of for five minutes?',
    completionMessage: 'A clean reset is part of sustainable work.',
    journalPrompt: 'What changed after stepping away? What would feel kind for the next block?',
  },
];

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'silence', emoji: '○' },
  { id: 'rain', name: 'rain', emoji: '🌧️', url: '/sounds/rain.mp3' },
  { id: 'ocean', name: 'ocean', emoji: '🌊', url: '/sounds/ocean.mp3' },
  { id: 'forest', name: 'forest', emoji: '🌲', url: '/sounds/forest.mp3' },
  { id: 'white-noise', name: 'white noise', emoji: '◌', url: '/sounds/white-noise.mp3' },
];

export default function ZenFocusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedModeId, setSelectedModeId] = useState<SessionMode['id']>('deep-work');
  const selectedMode = SESSION_MODES.find((mode) => mode.id === selectedModeId) || SESSION_MODES[0];
  const [duration, setDuration] = useState(selectedMode.duration);
  const [timeLeft, setTimeLeft] = useState(selectedMode.duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedSound, setSelectedSound] = useState('none');
  const [soundVolume, setSoundVolume] = useState(0.35);
  const [intention, setIntention] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState<SessionTask[]>([]);
  const [checkedTaskIds, setCheckedTaskIds] = useState<string[]>([]);
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTodaySessionCount = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/daily', {
        credentials: 'include',
      });

      if (!response.ok) return;

      const data: DailyStatsResponse = await response.json();
      setCompletedSessions(data.today?.focusSessionsCount || 0);
    } catch (error) {
      console.error('Failed to load today session count:', error);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchTodaySessionCount();
    }
  }, [user, fetchTodaySessionCount]);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft]);

  const stopAmbientSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const startAmbientSound = () => {
    if (selectedSound === 'none') return;

    const sound = AMBIENT_SOUNDS.find((item) => item.id === selectedSound);
    if (!sound?.url) return;

    if (!audioRef.current || !audioRef.current.src.includes(sound.url)) {
      audioRef.current = new Audio(sound.url);
      audioRef.current.loop = true;
    }

    audioRef.current.volume = soundVolume;
    audioRef.current.play().catch(() => {
      toast.message('Sound could not start in this browser.');
    });
  };

  const playCompletionBeep = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 760;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.22, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.45);
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    setIsPaused(false);
    stopAmbientSound();
    playCompletionBeep();

    const summary = {
      mode: selectedMode,
      duration,
      intention: intention.trim(),
      tasks,
      checkedTaskIds,
    };
    setCompletionSummary(summary);

    try {
      const response = await fetch('/api/focus-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          duration,
          type: selectedMode.id,
          ambientSound: selectedSound === 'none' ? null : selectedSound,
          intention: intention.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save focus session');
      }

      await fetchTodaySessionCount();

      toast.success('Session saved.', {
        style: {
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        },
      });
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Session completed, but saving failed.');
    }
  };

  const handleStart = () => {
    setCompletionSummary(null);
    setIsRunning(true);
    setIsPaused(false);
    startAmbientSound();
  };

  const handlePause = () => {
    setIsPaused((current) => !current);

    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play().catch(() => undefined);
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration * 60);
    setCompletionSummary(null);
    stopAmbientSound();
  };

  const handleModeChange = (modeId: SessionMode['id']) => {
    const mode = SESSION_MODES.find((item) => item.id === modeId);
    if (!mode) return;

    setSelectedModeId(modeId);
    setDuration(mode.duration);
    setTimeLeft(mode.duration * 60);
    setIsRunning(false);
    setIsPaused(false);
    setIntention('');
    setTaskInput('');
    setTasks([]);
    setCheckedTaskIds([]);
    setCompletionSummary(null);
    stopAmbientSound();
  };

  const handleSoundChange = (soundId: string) => {
    stopAmbientSound();
    audioRef.current = null;
    setSelectedSound(soundId);

    if (isRunning && !isPaused && soundId !== 'none') {
      const sound = AMBIENT_SOUNDS.find((item) => item.id === soundId);
      if (sound?.url) {
        audioRef.current = new Audio(sound.url);
        audioRef.current.loop = true;
        audioRef.current.volume = soundVolume;
        audioRef.current.play().catch(() => undefined);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setSoundVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const addTask = () => {
    const text = taskInput.trim();
    if (!text || tasks.length >= 3) return;

    setTasks((current) => [...current, { id: crypto.randomUUID(), text }]);
    setTaskInput('');
  };

  const toggleTask = (taskId: string) => {
    setCheckedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  };

  const removeTask = (taskId: string) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    setCheckedTaskIds((current) => current.filter((id) => id !== taskId));
  };

  const startAnotherSession = () => {
    setCompletionSummary(null);
    setTimeLeft(duration * 60);
    setIsRunning(false);
    setIsPaused(false);
    setCheckedTaskIds([]);
    setTaskInput('');
  };

  const openJournalReflection = () => {
    const summary = completionSummary;
    if (!summary) return;

    const completedTasks = summary.tasks.filter((task) => summary.checkedTaskIds.includes(task.id));
    const promptLines = [
      summary.mode.journalPrompt,
      '',
      summary.intention ? `Session intention: ${summary.intention}` : '',
      completedTasks.length > 0 ? `Completed: ${completedTasks.map((task) => task.text).join(', ')}` : '',
      '',
    ].filter(Boolean);

    const params = new URLSearchParams({
      write: 'true',
      title: `${summary.mode.name} reflection`,
      prompt: promptLines.join('\n'),
    });

    router.push(`/journal?${params.toString()}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const checkedTasks = tasks.filter((task) => checkedTaskIds.includes(task.id));

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
      }}>
        <div className="floating">
          <div className="zen-circle imperfect" style={{ position: 'relative', width: '60px', height: '60px', opacity: 0.3 }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative' }}>
      <div className="zen-circle" style={{ top: '15%', right: '8%', width: '120px', height: '120px' }} />
      <div className="zen-circle imperfect" style={{ bottom: '10%', left: '5%', width: '80px', height: '80px' }} />

      <nav style={{
        padding: 'var(--space-lg) var(--space-xl)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <Link href="/dashboard">
          <button className="zen-button">← back</button>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>sessions today</span>
          <span style={{ color: 'var(--sakura-pink)', fontWeight: 500 }}>{completedSessions}</span>
        </div>
      </nav>

      <main className="zen-container" style={{ marginTop: 'var(--space-xl)', maxWidth: '980px' }}>
        <section style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-sm)',
          }}>
            guided session
          </p>
          <h1 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-sm)' }}>
            {selectedMode.emoji} {selectedMode.name}
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            {selectedMode.purpose}
          </p>
        </section>

        {completionSummary ? (
          <section className="zen-card gentle-glow" style={{
            maxWidth: '620px',
            margin: '0 auto var(--space-2xl)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--amber-glow)', fontSize: '0.85rem', marginBottom: 'var(--space-sm)' }}>
              session complete
            </p>
            <h2 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-sm)' }}>
              {completionSummary.mode.completionMessage}
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-lg)' }}>
              {completionSummary.duration} minutes of {completionSummary.mode.name}
              {completionSummary.intention ? ` for "${completionSummary.intention}"` : ''}.
            </p>

            {completionSummary.tasks.length > 0 && (
              <div style={{
                maxWidth: '420px',
                margin: '0 auto var(--space-lg)',
                padding: 'var(--space-md)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                textAlign: 'left',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-sm)' }}>
                  {checkedTasks.length} of {completionSummary.tasks.length} tasks marked complete
                </p>
                {completionSummary.tasks.map((task) => (
                  <p
                    key={task.id}
                    style={{
                      color: completionSummary.checkedTaskIds.includes(task.id) ? 'var(--playful-mint)' : 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      marginBottom: '6px',
                    }}
                  >
                    {completionSummary.checkedTaskIds.includes(task.id) ? '✓' : '○'} {task.text}
                  </p>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <button className="zen-button-playful" onClick={openJournalReflection}>
                reflect in journal
              </button>
              <button className="zen-button" onClick={startAnotherSession}>
                start another
              </button>
              <Link href="/dashboard">
                <button className="zen-button">dashboard</button>
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <div className="zen-card zen-card-organic gentle-glow" style={{
                maxWidth: '400px',
                margin: '0 auto',
                padding: 'var(--space-2xl)',
                position: 'relative',
              }}>
                <svg style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%',
                  height: '100%',
                  opacity: 0.3,
                }} viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border)" strokeWidth="2" />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--sakura-pink)"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                    transform="rotate(-90 100 100)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h2 style={{
                    fontSize: 'clamp(3rem, 8vw, 5rem)',
                    fontWeight: 200,
                    color: 'var(--text-primary)',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--space-sm)',
                  }}>
                    {formatTime(timeLeft)}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    {isRunning && !isPaused && 'focusing...'}
                    {isRunning && isPaused && 'paused'}
                    {!isRunning && timeLeft === duration * 60 && 'ready when you are'}
                    {!isRunning && timeLeft < duration * 60 && timeLeft > 0 && 'almost there'}
                    {timeLeft === 0 && 'complete'}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: 'var(--space-md)',
                justifyContent: 'center',
                marginTop: 'var(--space-lg)',
                flexWrap: 'wrap',
              }}>
                {!isRunning ? (
                  <button className="zen-button-playful" onClick={handleStart} style={{ minWidth: '120px' }}>
                    begin
                  </button>
                ) : (
                  <button className="zen-button" onClick={handlePause} style={{ minWidth: '120px' }}>
                    {isPaused ? 'resume' : 'pause'}
                  </button>
                )}
                <button className="zen-button" onClick={handleReset}>reset</button>
              </div>
            </section>

            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <p style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                marginBottom: 'var(--space-lg)',
              }}>
                choose the shape of this block
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--space-sm)',
                maxWidth: '820px',
                margin: '0 auto',
              }}>
                {SESSION_MODES.map((mode) => {
                  const isActive = selectedMode.id === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeChange(mode.id)}
                      className={isActive ? 'zen-card hand-drawn-border' : 'zen-card'}
                      disabled={isRunning}
                      style={{
                        padding: 'var(--space-md)',
                        textAlign: 'left',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        background: isActive ? 'var(--surface-raised)' : 'var(--surface)',
                        border: isActive ? '1px solid var(--sakura-pink)' : '1px solid var(--border)',
                        opacity: isRunning && !isActive ? 0.45 : 1,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                        <span style={{ fontSize: '1.2rem' }}>{mode.emoji}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{mode.duration}m</span>
                      </div>
                      <p style={{
                        color: isActive ? 'var(--sakura-pink)' : 'var(--text-primary)',
                        fontSize: '0.92rem',
                        marginBottom: '4px',
                      }}>
                        {mode.name}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.45 }}>
                        {mode.purpose}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                maxWidth: '520px',
                margin: 'var(--space-md) auto 0',
                textAlign: 'center',
              }}>
                {selectedMode.purpose}
              </p>
            </section>

            <section className="zen-card" style={{
              maxWidth: '760px',
              margin: '0 auto var(--space-xl)',
              padding: 'var(--space-lg)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    marginBottom: 'var(--space-sm)',
                  }}>
                    intention
                  </label>
                  <input
                    value={intention}
                    onChange={(event) => setIntention(event.target.value.slice(0, 240))}
                    disabled={isRunning}
                    placeholder={selectedMode.intentionPlaceholder}
                    style={{
                      width: '100%',
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
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 'var(--space-xs)' }}>
                    Optional, but useful. Name the work before entering it.
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    marginBottom: 'var(--space-sm)',
                  }}>
                    small tasks
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                    <input
                      value={taskInput}
                      onChange={(event) => setTaskInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addTask();
                        }
                      }}
                      disabled={tasks.length >= 3}
                      placeholder={tasks.length >= 3 ? 'three is enough' : 'one concrete step...'}
                      style={{
                        minWidth: 0,
                        flex: 1,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        padding: '10px 12px',
                        outline: 'none',
                        fontSize: '0.85rem',
                      }}
                    />
                    <button className="zen-button" onClick={addTask} disabled={tasks.length >= 3} style={{ padding: '10px 14px' }}>
                      add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tasks.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        Add up to three steps if your mind feels scattered.
                      </p>
                    )}
                    {tasks.map((task) => {
                      const isChecked = checkedTaskIds.includes(task.id);
                      return (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => toggleTask(task.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: `1px solid ${isChecked ? 'var(--playful-mint)' : 'var(--border)'}`,
                              background: isChecked ? 'rgba(168, 213, 186, 0.2)' : 'transparent',
                              color: isChecked ? 'var(--playful-mint)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              lineHeight: 1,
                              fontSize: '0.75rem',
                            }}
                          >
                            {isChecked ? '✓' : ''}
                          </button>
                          <span style={{
                            flex: 1,
                            color: isChecked ? 'var(--playful-mint)' : 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            textDecoration: isChecked ? 'line-through' : 'none',
                          }}>
                            {task.text}
                          </span>
                          <button
                            onClick={() => removeTask(task.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="zen-card" style={{
              maxWidth: '560px',
              margin: '0 auto',
              padding: 'var(--space-md)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-md)',
                flexWrap: 'wrap',
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  sound
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {AMBIENT_SOUNDS.map((sound) => {
                    const isActive = selectedSound === sound.id;
                    return (
                      <button
                        key={sound.id}
                        onClick={() => handleSoundChange(sound.id)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '999px',
                          background: isActive ? 'var(--surface-raised)' : 'transparent',
                          border: isActive ? '1px solid var(--ocean-blue)' : '1px solid var(--border)',
                          color: isActive ? 'var(--ocean-blue)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        {sound.emoji} {sound.name}
                      </button>
                    );
                  })}
                </div>
                {selectedSound !== 'none' && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(event) => handleVolumeChange(parseFloat(event.target.value))}
                    style={{ width: '110px', accentColor: 'var(--ocean-blue)' }}
                  />
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
