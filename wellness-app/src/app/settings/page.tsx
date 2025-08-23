'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import '@/styles/zen-dark.css';

const WELLNESS_GOALS = [
  'Reduce stress',
  'Improve focus',
  'Better sleep',
  'Mindfulness',
  'Emotional balance',
  'Physical wellness',
];

const HEALTH_CONDITIONS = [
  'Anxiety',
  'Depression',
  'ADHD',
  'Insomnia',
  'Chronic stress',
  'None',
  'PCOS',
  'PMS',
];

const TONES = [
  { value: 'gentle', label: 'gentle', emoji: '🌸' },
  { value: 'encouraging', label: 'encouraging', emoji: '✨' },
  { value: 'motivational', label: 'motivational', emoji: '🔥' },
];

export default function ZenSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [tone, setTone] = useState('gentle');
  const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
  const [focusSessionLength, setFocusSessionLength] = useState(25);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.profile) {
        setGoals(user.profile.goals || []);
        setConditions(user.profile.healthConditions || []);
        setTone(user.profile.tone || 'gentle');
        setNotificationTimes(user.profile.notificationTimes || []);
        setFocusSessionLength(user.profile.focusSessionLength || 25);
      }
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          goals,
          healthConditions: conditions,
          tone,
          notificationTimes,
          focusSessionLength,
        }),
      });

      if (response.ok) {
        toast.success('✨ Settings saved beautifully', {
          style: {
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const toggleCondition = (condition: string) => {
    setConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const addCustomGoal = () => {
    if (customGoal && !goals.includes(customGoal)) {
      setGoals([...goals, customGoal]);
      setCustomGoal('');
    }
  };

  const addCustomCondition = () => {
    if (customCondition && !conditions.includes(customCondition)) {
      setConditions([...conditions, customCondition]);
      setCustomCondition('');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--background)'
      }}>
        <div className="floating">
          <div className="zen-circle imperfect" style={{ position: 'relative', width: '60px', height: '60px', opacity: 0.3 }}></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative' }}>
      {/* Decorative elements */}
      <div className="zen-circle" style={{ top: '20%', right: '10%', width: '100px', height: '100px' }}></div>
      <div className="zen-circle imperfect" style={{ bottom: '15%', left: '8%', width: '120px', height: '120px' }}></div>
      
      {/* Navigation */}
      <nav style={{ 
        padding: 'var(--space-lg) var(--space-xl)', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <Link href="/dashboard">
          <button className="zen-button">← back</button>
        </Link>
        
        <h1 className="zen-heading" style={{ fontSize: '1.2rem', margin: 0 }}>
          settings
        </h1>
      </nav>

      {/* Main Content */}
      <main className="zen-container" style={{ marginTop: 'var(--space-xl)', maxWidth: '800px' }}>
        {/* Profile Section */}
        <section className="zen-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 className="ink-brush" style={{ 
            fontSize: '1rem', 
            marginBottom: 'var(--space-lg)',
            color: 'var(--sakura-pink)'
          }}>
            your profile
          </h2>
          
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ 
              display: 'block',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              marginBottom: 'var(--space-xs)'
            }}>
              name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              marginBottom: 'var(--space-xs)'
            }}>
              email
            </label>
            <p style={{ color: 'var(--text-secondary)' }}>
              {user.email}
            </p>
          </div>
        </section>

        {/* Wellness Goals */}
        <section className="zen-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 className="ink-brush" style={{ 
            fontSize: '1rem', 
            marginBottom: 'var(--space-lg)',
            color: 'var(--sakura-pink)'
          }}>
            wellness goals
          </h2>
          
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)'
          }}>
            {WELLNESS_GOALS.map(goal => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={goals.includes(goal) ? 'zen-button-playful' : 'zen-button'}
                style={{
                  fontSize: '0.9rem',
                  padding: 'var(--space-xs) var(--space-md)',
                }}
              >
                {goal}
              </button>
            ))}
          </div>
          
          {/* Custom Goal */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="add your own..."
              style={{
                flex: 1,
                padding: 'var(--space-sm)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
            <button className="zen-button" onClick={addCustomGoal}>
              add
            </button>
          </div>
          
          {/* Display custom goals */}
          {goals.filter(g => !WELLNESS_GOALS.includes(g)).length > 0 && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              {goals.filter(g => !WELLNESS_GOALS.includes(g)).map(goal => (
                <span key={goal} style={{ 
                  display: 'inline-block',
                  margin: '4px',
                  padding: '4px 12px',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  color: 'var(--moss-green)'
                }}>
                  {goal} ×
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Health Conditions */}
        <section className="zen-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 className="ink-brush" style={{ 
            fontSize: '1rem', 
            marginBottom: 'var(--space-lg)',
            color: 'var(--sakura-pink)'
          }}>
            health considerations
          </h2>
          
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)'
          }}>
            {HEALTH_CONDITIONS.map(condition => (
              <button
                key={condition}
                onClick={() => toggleCondition(condition)}
                className={conditions.includes(condition) ? 'zen-button-playful' : 'zen-button'}
                style={{
                  fontSize: '0.9rem',
                  padding: 'var(--space-xs) var(--space-md)',
                }}
              >
                {condition}
              </button>
            ))}
          </div>
          
          {/* Custom Condition */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder="add your own..."
              style={{
                flex: 1,
                padding: 'var(--space-sm)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
            <button className="zen-button" onClick={addCustomCondition}>
              add
            </button>
          </div>
        </section>

        {/* Affirmation Tone */}
        <section className="zen-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 className="ink-brush" style={{ 
            fontSize: '1rem', 
            marginBottom: 'var(--space-lg)',
            color: 'var(--sakura-pink)'
          }}>
            affirmation tone
          </h2>
          
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            {TONES.map(t => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={tone === t.value ? 'zen-card hand-drawn-border' : 'zen-card'}
                style={{
                  flex: 1,
                  padding: 'var(--space-md)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: tone === t.value ? 'var(--surface-raised)' : 'var(--surface)',
                  border: tone === t.value ? '1px solid var(--sakura-pink)' : '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
                  {t.emoji}
                </div>
                <p style={{ 
                  color: tone === t.value ? 'var(--sakura-pink)' : 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  {t.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Focus Session Length */}
        <section className="zen-card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 className="ink-brush" style={{ 
            fontSize: '1rem', 
            marginBottom: 'var(--space-lg)',
            color: 'var(--sakura-pink)'
          }}>
            default focus time
          </h2>
          
          <div style={{ textAlign: 'center' }}>
            <input
              type="range"
              min="5"
              max="90"
              value={focusSessionLength}
              onChange={(e) => setFocusSessionLength(parseInt(e.target.value))}
              style={{
                width: '80%',
                accentColor: 'var(--sakura-pink)',
              }}
            />
            <p style={{ 
              marginTop: 'var(--space-sm)',
              fontSize: '1.5rem',
              fontWeight: 200,
              color: 'var(--text-primary)'
            }}>
              {focusSessionLength} minutes
            </p>
          </div>
        </section>

        {/* Save Button */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
          <button 
            className="zen-button-playful" 
            onClick={handleSave}
            disabled={saving}
            style={{ 
              padding: 'var(--space-sm) var(--space-xl)',
              fontSize: '1rem'
            }}
          >
            {saving ? 'saving...' : 'save changes ✨'}
          </button>
        </div>

        {/* Footer message */}
        <p style={{ 
          textAlign: 'center',
          marginTop: 'var(--space-2xl)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          fontStyle: 'italic'
        }}>
          your journey is uniquely yours
        </p>
      </main>
    </div>
  );
}
