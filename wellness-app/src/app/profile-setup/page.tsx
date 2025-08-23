'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import '@/styles/zen-dark.css';

const GOALS = [
  { id: 'reduce-stress', label: 'reduce stress', icon: '静', kanji: 'sei' },
  { id: 'improve-focus', label: 'improve focus', icon: '集', kanji: 'shuu' },
  { id: 'better-sleep', label: 'better sleep', icon: '眠', kanji: 'min' },
  { id: 'boost-confidence', label: 'boost confidence', icon: '勇', kanji: 'yuu' },
  { id: 'manage-anxiety', label: 'manage anxiety', icon: '和', kanji: 'wa' },
  { id: 'increase-productivity', label: 'increase productivity', icon: '進', kanji: 'shin' },
  { id: 'self-compassion', label: 'self-compassion', icon: '慈', kanji: 'ji' },
  { id: 'mindfulness', label: 'mindfulness', icon: '念', kanji: 'nen' },
];

const HEALTH_CONDITIONS = [
  { id: 'anxiety', label: 'anxiety', description: 'generalized or social' },
  { id: 'depression', label: 'depression', description: 'mood management' },
  { id: 'adhd', label: 'adhd', description: 'focus challenges' },
  { id: 'pcos', label: 'pcos', description: 'hormonal balance' },
  { id: 'pms', label: 'pms', description: 'monthly symptoms' },
  { id: 'ocd', label: 'ocd', description: 'repetitive patterns' },
  { id: 'chronic-pain', label: 'chronic pain', description: 'ongoing management' },
  { id: 'insomnia', label: 'insomnia', description: 'sleep difficulties' },
  { id: 'none', label: 'none apply', description: 'no specific conditions' },
];

const TONES = [
  { 
    id: 'gentle', 
    label: 'gentle & nurturing', 
    icon: '🌸',
    description: 'soft, compassionate',
    example: '"you are enough, just as you are"'
  },
  { 
    id: 'encouraging', 
    label: 'encouraging & supportive', 
    icon: '🌱',
    description: 'uplifting messages',
    example: '"you have the strength within"'
  },
  { 
    id: 'motivational', 
    label: 'motivational & bold', 
    icon: '⚡',
    description: 'action-oriented',
    example: '"today you rise and shine!"'
  },
];

const NOTIFICATION_TIMES = [
  { id: 'morning', label: 'morning', time: '08:00', icon: '朝' },
  { id: 'midday', label: 'midday', time: '12:00', icon: '昼' },
  { id: 'evening', label: 'evening', time: '18:00', icon: '夕' },
  { id: 'night', label: 'night', time: '21:00', icon: '夜' },
];

const SESSION_LENGTHS = [
  { value: 5, label: '5 min', description: 'quick reset' },
  { value: 10, label: '10 min', description: 'short break' },
  { value: 15, label: '15 min', description: 'standard' },
  { value: 25, label: '25 min', description: 'pomodoro' },
  { value: 30, label: '30 min', description: 'extended' },
  { value: 45, label: '45 min', description: 'deep work' },
];

export default function ProfileSetupPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('gentle');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['morning']);
  const [sessionLength, setSessionLength] = useState(15);

  const totalSteps = 5;

  useEffect(() => {
    if (user?.profile) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleCondition = (conditionId: string) => {
    if (conditionId === 'none') {
      setSelectedConditions(['none']);
    } else {
      setSelectedConditions(prev => {
        const filtered = prev.filter(id => id !== 'none');
        return filtered.includes(conditionId)
          ? filtered.filter(id => id !== conditionId)
          : [...filtered, conditionId];
      });
    }
  };

  const toggleTime = (timeId: string) => {
    setSelectedTimes(prev => 
      prev.includes(timeId) 
        ? prev.filter(id => id !== timeId)
        : [...prev, timeId]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const profileData = {
        goals: selectedGoals,
        healthConditions: selectedConditions.filter(c => c !== 'none'),
        tone: selectedTone,
        notificationTimes: selectedTimes.map(id => {
          const time = NOTIFICATION_TIMES.find(t => t.id === id);
          return time?.time || '08:00';
        }),
        focusSessionLength: sessionLength,
      };

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      await refreshUser();
      toast.success('✨ Profile setup complete! Welcome to your wellness journey.');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
      console.error('Profile setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedGoals.length > 0;
      case 2: return selectedConditions.length > 0;
      case 3: return true;
      case 4: return selectedTimes.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative' }}>
      {/* Decorative elements */}
      <div className="zen-circle" style={{ top: '10%', right: '15%', width: '150px', height: '150px', opacity: 0.02 }}></div>
      <div className="zen-circle imperfect" style={{ bottom: '20%', left: '10%', width: '100px', height: '100px', opacity: 0.03 }}></div>
      
      <div className="zen-container" style={{ paddingTop: 'var(--space-2xl)', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h1 className="zen-heading zen-heading-xl" style={{ marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontFamily: 'var(--font-playful)', color: 'var(--sakura-pink)' }}>zenn</span>
            {' '}• profile setup
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            step {currentStep} of {totalSteps} • 心を開けば、世界が開く
          </p>
          
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'center', marginTop: 'var(--space-md)' }}>
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: i < currentStep ? 'var(--sakura-pink)' : 'var(--border)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="zen-card" style={{ 
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%)',
          border: '1px solid var(--border-subtle)',
        }}>
          {/* Step Content */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            {currentStep === 1 && (
              <>
                <h2 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-xs)' }}>
                  what brings you here?
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                  select your wellness goals • choose as many as resonate
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
                  {GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className="zen-goal-card"
                      style={{
                        padding: 'var(--space-md)',
                        background: selectedGoals.includes(goal.id) 
                          ? 'linear-gradient(135deg, rgba(212, 130, 143, 0.1) 0%, rgba(212, 130, 143, 0.05) 100%)'
                          : 'var(--surface-raised)',
                        border: `1px solid ${selectedGoals.includes(goal.id) ? 'var(--sakura-pink)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)', opacity: 0.8 }}>
                        {goal.icon}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: selectedGoals.includes(goal.id) ? 'var(--sakura-pink)' : 'var(--text-secondary)' 
                      }}>
                        {goal.label}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <h2 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-xs)' }}>
                  health considerations
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                  this helps us tailor your experience • your data is private
                </p>
                
                <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                  {HEALTH_CONDITIONS.map((condition) => (
                    <button
                      key={condition.id}
                      onClick={() => toggleCondition(condition.id)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-md)',
                        background: selectedConditions.includes(condition.id) 
                          ? 'linear-gradient(90deg, rgba(139, 122, 168, 0.1) 0%, rgba(139, 122, 168, 0.05) 100%)'
                          : 'transparent',
                        border: `1px solid ${selectedConditions.includes(condition.id) ? 'var(--twilight-purple)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ 
                          color: selectedConditions.includes(condition.id) ? 'var(--twilight-purple)' : 'var(--text-primary)',
                          marginBottom: '2px',
                        }}>
                          {condition.label}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {condition.description}
                        </div>
                      </div>
                      {selectedConditions.includes(condition.id) && (
                        <div style={{ color: 'var(--twilight-purple)' }}>✓</div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <h2 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-xs)' }}>
                  affirmation tone
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                  how would you like your affirmations to feel?
                </p>
                
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-lg)',
                        background: selectedTone === tone.id 
                          ? 'linear-gradient(135deg, rgba(194, 155, 108, 0.1) 0%, rgba(194, 155, 108, 0.05) 100%)'
                          : 'var(--surface-raised)',
                        border: `1px solid ${selectedTone === tone.id ? 'var(--amber-glow)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <span style={{ fontSize: '1.5rem' }}>{tone.icon}</span>
                        <span style={{ 
                          color: selectedTone === tone.id ? 'var(--amber-glow)' : 'var(--text-primary)',
                          fontWeight: '500',
                        }}>
                          {tone.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                        {tone.description}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {tone.example}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentStep === 4 && (
              <>
                <h2 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-xs)' }}>
                  reminder times
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                  when would you like gentle reminders?
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                  {NOTIFICATION_TIMES.map((time) => (
                    <button
                      key={time.id}
                      onClick={() => toggleTime(time.id)}
                      style={{
                        padding: 'var(--space-lg)',
                        background: selectedTimes.includes(time.id) 
                          ? 'linear-gradient(135deg, rgba(107, 140, 174, 0.1) 0%, rgba(107, 140, 174, 0.05) 100%)'
                          : 'var(--surface-raised)',
                        border: `1px solid ${selectedTimes.includes(time.id) ? 'var(--ocean-blue)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)', opacity: 0.9 }}>
                        {time.icon}
                      </div>
                      <div style={{ 
                        color: selectedTimes.includes(time.id) ? 'var(--ocean-blue)' : 'var(--text-primary)',
                        marginBottom: '2px',
                      }}>
                        {time.label}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {time.time}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentStep === 5 && (
              <>
                <h2 className="zen-heading zen-heading-lg" style={{ marginBottom: 'var(--space-xs)' }}>
                  session length
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                  how long are your typical focus sessions?
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
                  {SESSION_LENGTHS.map((length) => (
                    <button
                      key={length.value}
                      onClick={() => setSessionLength(length.value)}
                      style={{
                        padding: 'var(--space-md)',
                        background: sessionLength === length.value 
                          ? 'linear-gradient(135deg, rgba(122, 154, 126, 0.1) 0%, rgba(122, 154, 126, 0.05) 100%)'
                          : 'var(--surface-raised)',
                        border: `1px solid ${sessionLength === length.value ? 'var(--moss-green)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ 
                        color: sessionLength === length.value ? 'var(--moss-green)' : 'var(--text-primary)',
                        fontWeight: '500',
                        marginBottom: '2px',
                      }}>
                        {length.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {length.description}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border)',
          }}>
            <button
              className="zen-button"
              onClick={handleBack}
              disabled={currentStep === 1}
              style={{ 
                opacity: currentStep === 1 ? 0.3 : 1,
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← back
            </button>

            {currentStep < totalSteps ? (
              <button
                className="zen-button-primary"
                onClick={handleNext}
                disabled={!canProceed()}
                style={{ 
                  opacity: !canProceed() ? 0.5 : 1,
                  cursor: !canProceed() ? 'not-allowed' : 'pointer',
                }}
              >
                next →
              </button>
            ) : (
              <button
                className="zen-button-primary"
                onClick={handleSubmit}
                disabled={isLoading || !canProceed()}
                style={{ 
                  opacity: isLoading || !canProceed() ? 0.5 : 1,
                  cursor: isLoading || !canProceed() ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <>
                    <span className="zen-circle imperfect" style={{ 
                      display: 'inline-block',
                      width: '12px', 
                      height: '12px',
                      marginRight: '8px',
                      animation: 'spin 1s linear infinite',
                    }}></span>
                    setting up...
                  </>
                ) : (
                  'complete setup ✓'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        {currentStep > 1 && (
          <div style={{ 
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              your selections:
              <div style={{ marginTop: 'var(--space-xs)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                {selectedGoals.map(id => {
                  const goal = GOALS.find(g => g.id === id);
                  return goal && (
                    <span key={id} style={{
                      padding: '2px 8px',
                      background: 'rgba(212, 130, 143, 0.1)',
                      border: '1px solid var(--sakura-pink)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--sakura-pink)',
                      fontSize: '0.8rem',
                    }}>
                      {goal.label}
                    </span>
                  );
                })}
                {currentStep > 3 && (
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(194, 155, 108, 0.1)',
                    border: '1px solid var(--amber-glow)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--amber-glow)',
                    fontSize: '0.8rem',
                  }}>
                    {TONES.find(t => t.id === selectedTone)?.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
