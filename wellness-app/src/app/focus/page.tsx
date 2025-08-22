'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import '@/styles/zen-dark.css';

const SESSION_TYPES = [
  { id: 'focus', name: 'deep focus', duration: 25, emoji: '🎯' },
  { id: 'short', name: 'quick', duration: 10, emoji: '⚡' },
  { id: 'break', name: 'rest', duration: 5, emoji: '☕' },
  { id: 'meditation', name: 'meditate', duration: 15, emoji: '🧘' },
  { id: 'long', name: 'marathon', duration: 45, emoji: '🏔️' },
  { id: 'custom', name: 'your time', duration: 20, emoji: '✨' },
];

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'no sound', emoji: '🔇' },
  { id: 'rain', name: 'rain', emoji: '🌧️', url: '/sounds/rain.mp3' },
  { id: 'ocean', name: 'ocean waves', emoji: '🌊', url: '/sounds/ocean.mp3' },
  { id: 'forest', name: 'forest', emoji: '🌲', url: '/sounds/forest.mp3' },
  { id: 'white-noise', name: 'white noise', emoji: '📻', url: '/sounds/white-noise.mp3' },
  { id: 'campfire', name: 'campfire', emoji: '🔥', url: '/sounds/campfire.mp3' },
];

export default function ZenFocusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Timer state
  const [selectedType, setSelectedType] = useState('focus');
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedSound, setSelectedSound] = useState('none');
  const [soundVolume, setSoundVolume] = useState(0.5);
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  // Zen quotes for breaks
  const zenQuotes = [
    "The mind is like water. When calm, everything becomes clear.",
    "In the space between breaths, find your center.",
    "Progress is not always forward. Sometimes it's inward.",
    "Be like bamboo: flexible, yet unbreakable.",
    "The journey of a thousand miles begins with a single breath.",
  ];
  const [currentQuote] = useState(zenQuotes[Math.floor(Math.random() * zenQuotes.length)]);

  useEffect(() => {
    if (user?.profile?.focusSessionLength) {
      setDuration(user.profile.focusSessionLength);
      setTimeLeft(user.profile.focusSessionLength * 60);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    setCompletedSessions((prev) => prev + 1);
    
    // Stop ambient sound
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Play completion beep
    playCompletionBeep();
    
    // Save session
    try {
      await fetch('/api/focus-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          duration: Math.ceil(duration),
          type: selectedType,
        }),
      });
      
      toast.success('✨ Beautiful work! You completed your session.', {
        style: {
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        },
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };
  
  const playCompletionBeep = () => {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Play a second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 600);
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    
    // Start ambient sound if selected
    if (selectedSound !== 'none') {
      const sound = AMBIENT_SOUNDS.find(s => s.id === selectedSound);
      if (sound?.url) {
        // Note: You'll need to add the actual sound files
        // For now, we're just setting up the structure
        if (!audioRef.current) {
          audioRef.current = new Audio(sound.url);
          audioRef.current.loop = true;
          audioRef.current.volume = soundVolume;
        }
        audioRef.current.play().catch(e => {
          console.log('Audio playback failed:', e);
          // Handle browser autoplay restrictions
        });
      }
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    
    // Pause/resume ambient sound
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration * 60);
    
    // Stop ambient sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };
  
  const handleSoundChange = (soundId: string) => {
    // Stop current sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setSelectedSound(soundId);
    
    // If timer is running, start the new sound
    if (isRunning && !isPaused && soundId !== 'none') {
      const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
      if (sound?.url) {
        audioRef.current = new Audio(sound.url);
        audioRef.current.loop = true;
        audioRef.current.volume = soundVolume;
        audioRef.current.play().catch(e => console.log('Audio playback failed:', e));
      }
    }
  };
  
  const handleVolumeChange = (newVolume: number) => {
    setSoundVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleTypeChange = (typeId: string) => {
    const type = SESSION_TYPES.find((t) => t.id === typeId);
    if (type) {
      setSelectedType(typeId);
      setDuration(type.duration);
      setTimeLeft(type.duration * 60);
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

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
      <div className="zen-circle" style={{ top: '15%', right: '8%', width: '120px', height: '120px' }}></div>
      <div className="zen-circle imperfect" style={{ bottom: '10%', left: '5%', width: '80px', height: '80px' }}></div>
      
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            sessions today:
          </span>
          <span style={{ color: 'var(--sakura-pink)', fontWeight: 500 }}>
            {completedSessions}
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="zen-container" style={{ marginTop: 'var(--space-xl)', maxWidth: '900px' }}>
        {/* Timer Display */}
        <section style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div className="zen-card zen-card-organic gentle-glow" style={{ 
            maxWidth: '400px', 
            margin: '0 auto',
            padding: 'var(--space-2xl)',
            position: 'relative'
          }}>
            {/* Progress Ring */}
            <svg style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              opacity: 0.3
            }} viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="var(--border)"
                strokeWidth="2"
              />
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
            
            {/* Time Display */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h1 style={{ 
                fontSize: 'clamp(3rem, 8vw, 5rem)', 
                fontWeight: 200,
                color: 'var(--text-primary)',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-sm)'
              }}>
                {formatTime(timeLeft)}
              </h1>
              
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                {isRunning && !isPaused && "focusing..."}
                {isRunning && isPaused && "paused"}
                {!isRunning && timeLeft === duration * 60 && "ready when you are"}
                {!isRunning && timeLeft < duration * 60 && timeLeft > 0 && "almost there"}
                {timeLeft === 0 && "complete ✨"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-md)', 
            justifyContent: 'center',
            marginTop: 'var(--space-lg)'
          }}>
            {!isRunning ? (
              <button className="zen-button" onClick={handleStart} style={{ minWidth: '120px' }}>
                begin
              </button>
            ) : (
              <button className="zen-button" onClick={handlePause} style={{ minWidth: '120px' }}>
                {isPaused ? 'resume' : 'pause'}
              </button>
            )}
            <button className="zen-button" onClick={handleReset}>
              reset
            </button>
          </div>
        </section>

        {/* Session Types */}
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <p style={{ 
            textAlign: 'center',
            color: 'var(--text-muted)', 
            fontSize: '0.9rem',
            marginBottom: 'var(--space-lg)'
          }}>
            choose your rhythm
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--space-sm)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {SESSION_TYPES.map((type) => {
              const isActive = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={isActive ? "zen-card hand-drawn-border" : "zen-card"}
                  style={{
                    padding: 'var(--space-md)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isActive ? 'var(--surface-raised)' : 'var(--surface)',
                    border: isActive ? '1px solid var(--sakura-pink)' : '1px solid var(--border)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
                    {type.emoji}
                  </div>
                  <p style={{ 
                    color: isActive ? 'var(--sakura-pink)' : 'var(--text-primary)',
                    fontSize: '0.9rem',
                    marginBottom: '4px'
                  }}>
                    {type.name}
                  </p>
                  <p style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.8rem' 
                  }}>
                    {type.duration} min
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom Duration for custom type */}
        {selectedType === 'custom' && (
          <section style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
            <input
              type="range"
              min="5"
              max="90"
              value={duration}
              onChange={(e) => {
                const newDuration = parseInt(e.target.value);
                setDuration(newDuration);
                setTimeLeft(newDuration * 60);
              }}
              style={{
                width: '200px',
                accentColor: 'var(--sakura-pink)',
              }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 'var(--space-xs)' }}>
              {duration} minutes
            </p>
          </section>
        )}

        {/* Zen Quote */}
        <section className="zen-card" style={{ 
          maxWidth: '500px', 
          margin: '0 auto',
          textAlign: 'center',
          marginTop: 'var(--space-2xl)'
        }}>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            fontStyle: 'italic'
          }}>
            "{currentQuote}"
          </p>
        </section>

        {/* Sound Settings */}
        <section style={{ marginTop: 'var(--space-2xl)' }}>
          <div className="zen-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <p style={{ 
              textAlign: 'center',
              color: 'var(--text-muted)', 
              fontSize: '0.9rem',
              marginBottom: 'var(--space-lg)'
            }}>
              ambient sounds
            </p>
            
            {/* Sound Options */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-lg)'
            }}>
              {AMBIENT_SOUNDS.map((sound) => {
                const isActive = selectedSound === sound.id;
                return (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundChange(sound.id)}
                    style={{
                      padding: 'var(--space-sm)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: isActive ? 'var(--surface-raised)' : 'transparent',
                      border: isActive ? '1px solid var(--ocean-blue)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'all 0.3s ease',
                      color: isActive ? 'var(--ocean-blue)' : 'var(--text-muted)'
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                      {sound.emoji}
                    </div>
                    <p style={{ fontSize: '0.75rem' }}>
                      {sound.name}
                    </p>
                  </button>
                );
              })}
            </div>
            
            {/* Volume Control */}
            {selectedSound !== 'none' && (
              <div style={{ textAlign: 'center' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-sm)',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  <span>🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    style={{
                      width: '150px',
                      accentColor: 'var(--ocean-blue)',
                    }}
                  />
                  <span>{Math.round(soundVolume * 100)}%</span>
                </label>
              </div>
            )}
            
            {/* Instructions */}
            <div style={{ 
              marginTop: 'var(--space-lg)',
              padding: 'var(--space-md)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)'
            }}>
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.8rem',
                textAlign: 'center',
                lineHeight: 1.5
              }}>
                <strong style={{ color: 'var(--amber-glow)' }}>How to add sounds:</strong><br/>
                Create a <code style={{ 
                  background: 'var(--surface-raised)', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}>public/sounds</code> folder and add these files:<br/>
                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  rain.mp3, ocean.mp3, forest.mp3, white-noise.mp3, campfire.mp3
                </span><br/>
                <span style={{ opacity: 0.7 }}>
                  You can download free ambient sounds from freesound.org or zapsplat.com
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
