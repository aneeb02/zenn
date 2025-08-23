'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import '@/styles/zen-dark.css';
import quotesData from '@/data/quotes.json';

interface DailyStats {
  today: {
    affirmationsViewed: number;
    sessionMinutes: number;
    streakCount: number;
  };
  currentStreak: number;
  week: Array<{
    date: string;
    affirmationsViewed: number;
    sessionMinutes: number;
  }>;
}

interface Quote {
  text: string;
  author: string;
  category: string;
}

export default function ZenDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [zenMoment, setZenMoment] = useState('');
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [savedAffirmations, setSavedAffirmations] = useState<string[]>([]);

  // Zen moments - playful, thoughtful messages
  const zenMoments = [
    "The tea is warm, the moment is now",
    "Breathe in possibility, breathe out doubt",
    "Your path unfolds one step at a time",
    "Like ripples on water, your calm spreads",
    "今 (ima) - This moment is all we have",
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');

    // Random zen moment
    setZenMoment(zenMoments[Math.floor(Math.random() * zenMoments.length)]);
    
    // Load random quote
    const randomQuote = quotesData.quotes[Math.floor(Math.random() * quotesData.quotes.length)];
    setCurrentQuote(randomQuote);
    
    // Load saved affirmations from localStorage
    const saved = localStorage.getItem('savedAffirmations');
    if (saved) {
      setSavedAffirmations(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && !user.profile) {
      router.push('/profile-setup');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.profile) {
      fetchDailyAffirmations();
      fetchStats();
    }
  }, [user]);

  const fetchDailyAffirmations = async () => {
    try {
      const response = await fetch('/api/affirmations/daily', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAffirmations(data.affirmations || []);
      }
    } catch (error) {
      setAffirmations([
        "You are exactly where you need to be",
        "Trust the timing of your life",
        "Your presence is a gift to the world",
      ]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/daily', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      setStats({
        today: { affirmationsViewed: 0, sessionMinutes: 0, streakCount: 0 },
        currentStreak: 0,
        week: [],
      });
    }
  };

  const handleNextAffirmation = () => {
    // Save current affirmation before moving to next
    const currentAffirmation = affirmations[currentAffirmationIndex];
    if (currentAffirmation && !savedAffirmations.includes(currentAffirmation)) {
      const newSaved = [...savedAffirmations, currentAffirmation];
      setSavedAffirmations(newSaved);
      localStorage.setItem('savedAffirmations', JSON.stringify(newSaved));
    }
    
    setCurrentAffirmationIndex((prev) => (prev + 1) % affirmations.length);
    
    // Also get a new quote
    const randomQuote = quotesData.quotes[Math.floor(Math.random() * quotesData.quotes.length)];
    setCurrentQuote(randomQuote);
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
      {/* Decorative circles */}
      <div className="zen-circle" style={{ top: '10%', left: '5%', width: '150px', height: '150px' }}></div>
      <div className="zen-circle imperfect" style={{ bottom: '20%', right: '10%', width: '100px', height: '100px' }}></div>
      
      {/* Navigation - Minimal and subtle */}
      <nav style={{ 
        padding: 'var(--space-lg) var(--space-xl)', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
          <span className="zen-heading-playful" style={{ fontSize: '1.5rem' }}>zenn</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 300 }}>• wellness space</span>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <Link href="/focus">
            <button className="zen-button">focus</button>
          </Link>
          <Link href="/settings">
            <button className="zen-button">settings</button>
          </Link>
          <Link href="/journal">
            <button className="zen-button">journal</button>
          </Link>
          <button className="zen-button" onClick={logout}>logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="zen-container" style={{ marginTop: 'var(--space-xl)' }}>
        {/* Greeting Section */}
        <section style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
          <h1 className="zen-heading zen-heading-xl" style={{ marginBottom: 'var(--space-sm)' }}>
            {timeOfDay === 'morning' && '朝'}
            {timeOfDay === 'afternoon' && '午後'}
            {timeOfDay === 'evening' && '夕'} 
            <span style={{ marginLeft: 'var(--space-md)' }}>
              good {timeOfDay}, {user.name?.split(' ')[0]?.toLowerCase() || 'friend'}
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            {zenMoment}
          </p>
        </section>

        {/* Today's Affirmation - Main Focus */}
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="zen-card zen-card-organic hand-drawn-border" style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            textAlign: 'center',
            padding: 'var(--space-xl)'
          }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <span className="ink-brush" style={{ 
                fontSize: '0.8rem', 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--sakura-pink)'
              }}>
                today's reflection
              </span>
            </div>
            
            <p style={{ 
              fontSize: '1.4rem', 
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              fontWeight: 300,
              marginBottom: 'var(--space-lg)'
            }}>
              "{affirmations[currentAffirmationIndex] || 'Loading...'}"
            </p>
            
            {currentQuote && (
              <div style={{
                marginTop: 'var(--space-xl)',
                paddingTop: 'var(--space-lg)',
                borderTop: '1px dashed var(--border-subtle)',
              }}>
                <p style={{ 
                  fontSize: '1rem', 
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  marginBottom: 'var(--space-sm)'
                }}>
                  "{currentQuote.text}"
                </p>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  textAlign: 'right'
                }}>
                  — {currentQuote.author}
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
              <button className="zen-button-playful" onClick={handleNextAffirmation}>
                another one →
              </button>
              <Link href="/focus">
                <button className="zen-button">begin focus session</button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Grid - Minimal and Clean */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-2xl)'
        }}>
          {/* Streak */}
          <div className="zen-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>
                  current streak
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: 200, color: 'var(--amber-glow)' }}>
                  {stats?.currentStreak || 0}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  days
                </p>
              </div>
              <div style={{ 
                fontSize: '2rem', 
                opacity: 0.3,
                transform: 'rotate(15deg)'
              }}>
                🔥
              </div>
            </div>
          </div>

          {/* Focus Time */}
          <div className="zen-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>
                  focus today
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: 200, color: 'var(--ocean-blue)' }}>
                  {stats?.today.sessionMinutes || 0}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  minutes
                </p>
              </div>
              <div style={{ 
                fontSize: '2rem', 
                opacity: 0.3,
                transform: 'rotate(-10deg)'
              }}>
                ⏱
              </div>
            </div>
          </div>

          {/* Wellness Score */}
          <div className="zen-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>
                  wellness level
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: 200, color: 'var(--moss-green)' }}>
                  {Math.min(100, (stats?.currentStreak || 0) * 10 + (stats?.today.sessionMinutes || 0))}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  energy
                </p>
              </div>
              <div style={{ 
                fontSize: '2rem', 
                opacity: 0.3,
                transform: 'rotate(5deg)'
              }}>
                🌱
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Progress - Visual and Minimal */}
        <section className="zen-card" style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ 
            fontSize: '0.9rem', 
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-lg)',
            letterSpacing: '0.05em'
          }}>
            this week's rhythm
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100px' }}>
            {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day, index) => {
              const height = Math.random() * 70 + 20; // Random heights for demo
              const isToday = index === new Date().getDay() - 1;
              return (
                <div key={day} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  flex: 1
                }}>
                  <div style={{
                    width: '4px',
                    height: `${height}%`,
                    background: isToday ? 'var(--sakura-pink)' : 'var(--medium-gray)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'all 0.3s ease',
                    opacity: isToday ? 1 : 0.5
                  }}></div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: isToday ? 'var(--sakura-pink)' : 'var(--text-muted)'
                  }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions - Playful */}
        <section style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.9rem',
            marginBottom: 'var(--space-lg)'
          }}>
            what would you like to do?
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/focus">
              <button className="zen-button-playful">
                <span style={{ marginRight: 'var(--space-xs)' }}>🧘</span>
                meditate
              </button>
            </Link>
            <Link href="/journal">
              <button className="zen-button-playful">
                <span style={{ marginRight: 'var(--space-xs)' }}>💭</span>
                reflect
              </button>
            </Link>
            
          </div>
        </section>
      </main>

      {/* Footer - Minimal */}
      <footer style={{ 
        textAlign: 'center', 
        padding: 'var(--space-2xl) 0 var(--space-xl)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        <p style={{ opacity: 0.5 }}>
          be gentle with yourself • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
