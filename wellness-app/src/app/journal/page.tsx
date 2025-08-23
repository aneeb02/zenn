'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import '@/styles/zen-dark.css';
import type { CreateJournalEntryInput } from '@/lib/validations/api';

interface JournalEntry {
  id: string;
  title: string;
  content?: string;
  mood?: string | null;
  tags: string[];
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string | null;
  reflections?: any[];
}

const moodEmojis: Record<string, string> = {
  happy: '✨',
  calm: '🌊',
  anxious: '🌀',
  sad: '🌧️',
  energetic: '⚡',
  grateful: '🙏',
  frustrated: '🔥',
  hopeful: '🌱',
  neutral: '○',
};

export default function ZenJournalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'insights'>('list');
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // Zen quotes for the journal
  const zenQuotes = [
    '言葉は心の鏡 • Words are the mirror of the heart',
    '今日の一歩、明日の道 • Today\'s step, tomorrow\'s path',
    '静寂の中に真実あり • In silence, there is truth',
    '心を開けば、世界が開く • Open your heart, open the world',
  ];
  const [currentQuote] = useState(zenQuotes[Math.floor(Math.random() * zenQuotes.length)]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchEntries();
    }
  }, [user, loading, router]);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/journal', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

  const fetchEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedEntry(data.entry);
      } else {
        toast.error('Failed to load entry');
      }
    } catch (error) {
      console.error('Failed to fetch entry:', error);
      toast.error('Failed to load entry');
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      toast.error('Please add a title and content');
      return;
    }

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          content,
          mood: mood || undefined,
          tags,
          isPrivate: true,
        }),
      });

      if (response.ok) {
        toast.success('✨ Entry saved to your journal');
        await fetchEntries();
        setIsWriting(false);
        resetForm();
      }
    } catch (error) {
      toast.error('Failed to save entry');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMood('');
    setTags([]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
    const day = date.getDate();
    return { month, day };
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="zen-circle imperfect" style={{ width: '60px', height: '60px', opacity: 0.3 }}></div>
      </div>
    );
  }

  if (isWriting) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        {/* Writing Mode Header */}
        <nav style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="zen-button" onClick={() => setIsWriting(false)}>← back</button>
          <button className="zen-button-primary" onClick={handleSave}>save entry</button>
        </nav>

        {/* Writing Area */}
        <div className="zen-container" style={{ maxWidth: '800px', marginTop: 'var(--space-xl)' }}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <input
              type="text"
              placeholder="give your thoughts a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                padding: 'var(--space-sm) 0',
                fontSize: '1.5rem',
                fontWeight: '300',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          {/* Mood Selector */}
          <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {Object.entries(moodEmojis).map(([moodKey, emoji]) => (
              <button
                key={moodKey}
                onClick={() => setMood(mood === moodKey ? '' : moodKey)}
                className={`zen-mood-button ${mood === moodKey ? 'active' : ''}`}
                style={{
                  padding: 'var(--space-xs) var(--space-sm)',
                  background: mood === moodKey ? 'var(--surface-raised)' : 'var(--surface)',
                  border: `1px solid ${mood === moodKey ? 'var(--sakura-pink)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  color: mood === moodKey ? 'var(--sakura-pink)' : 'var(--text-muted)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {emoji} {moodKey}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <textarea
            placeholder="let your thoughts flow like water..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '400px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)',
              fontSize: '1rem',
              lineHeight: '1.8',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />

          {/* Word Count */}
          <div style={{ marginTop: 'var(--space-sm)', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>
            {content.split(/\s+/).filter(word => word.length > 0).length} words • 
            {Math.max(1, Math.ceil(content.split(/\s+/).filter(word => word.length > 0).length / 200))} min read
          </div>
        </div>
      </div>
    );
  }

  if (selectedEntry) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        {/* Reading Mode Header */}
        <nav style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="zen-button" onClick={() => setSelectedEntry(null)}>← back</button>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="zen-button">edit</button>
            <button className="zen-button" style={{ color: 'var(--playful-coral)' }}>delete</button>
          </div>
        </nav>

        {/* Entry Content */}
        <div className="zen-container" style={{ maxWidth: '800px', marginTop: 'var(--space-xl)' }}>
          <div className="zen-card">
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <h1 className="zen-heading zen-heading-lg">{selectedEntry.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>{new Date(selectedEntry.createdAt).toLocaleDateString()}</span>
                {selectedEntry.mood && <span>{moodEmojis[selectedEntry.mood]} {selectedEntry.mood}</span>}
                <span>{selectedEntry.wordCount} words</span>
              </div>
            </div>
            
            <div style={{ 
              fontSize: '1.05rem', 
              lineHeight: '1.8', 
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
            }}>
              {selectedEntry.content}
            </div>

            {selectedEntry.tags && selectedEntry.tags.length > 0 && (
              <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                {selectedEntry.tags.map((tag, idx) => (
                  <span key={idx} style={{
                    padding: '2px var(--space-sm)',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative' }}>
      {/* Decorative elements */}
      <div className="zen-circle" style={{ top: '20%', right: '10%', width: '120px', height: '120px', opacity: 0.03 }}></div>
      <div className="zen-circle imperfect" style={{ bottom: '30%', left: '5%', width: '80px', height: '80px', opacity: 0.03 }}></div>

      {/* Navigation */}
      <nav style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
          <Link href="/dashboard">
            <span className="zen-heading-playful" style={{ fontSize: '1.2rem', cursor: 'pointer' }}>zenn</span>
          </Link>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>• journal</span>
        </div>
        
        <button className="zen-button-primary" onClick={() => setIsWriting(true)}>
          + new entry
        </button>
      </nav>

      {/* Main Content */}
      <main className="zen-container" style={{ marginTop: 'var(--space-xl)' }}>
        {/* Header */}
        <section style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
          <h1 className="zen-heading zen-heading-xl" style={{ marginBottom: 'var(--space-sm)' }}>
            日記 <span style={{ marginLeft: 'var(--space-md)', fontWeight: '300' }}>journal</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            {currentQuote}
          </p>
        </section>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)', justifyContent: 'center' }}>
          <button 
            className={`zen-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            style={{ 
              background: viewMode === 'list' ? 'var(--surface-raised)' : 'transparent',
              color: viewMode === 'list' ? 'var(--sakura-pink)' : 'var(--text-muted)',
            }}
          >
            entries
          </button>
          <button 
            className={`zen-button ${viewMode === 'insights' ? 'active' : ''}`}
            onClick={() => setViewMode('insights')}
            style={{ 
              background: viewMode === 'insights' ? 'var(--surface-raised)' : 'transparent',
              color: viewMode === 'insights' ? 'var(--sakura-pink)' : 'var(--text-muted)',
            }}
          >
            insights
          </button>
        </div>

        {/* Content Area */}
        {viewMode === 'list' ? (
          <div style={{ display: 'grid', gap: 'var(--space-md)', maxWidth: '800px', margin: '0 auto' }}>
            {entries.length === 0 ? (
              <div className="zen-card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                  your journal awaits its first entry
                </p>
                <button className="zen-button-primary" onClick={() => setIsWriting(true)}>
                  begin writing
                </button>
              </div>
            ) : (
              entries.map((entry) => {
                const { month, day } = formatDate(entry.createdAt);
                return (
                  <div 
                    key={entry.id} 
                    className="zen-card hand-drawn-border"
                    onClick={() => fetchEntry(entry.id)}
                    style={{ cursor: 'pointer', display: 'flex', gap: 'var(--space-lg)' }}
                  >
                    {/* Date Block */}
                    <div style={{ 
                      minWidth: '60px',
                      textAlign: 'center',
                      borderRight: '1px solid var(--border)',
                      paddingRight: 'var(--space-lg)',
                    }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: '300', color: 'var(--sakura-pink)' }}>{day}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{month}</div>
                    </div>

                    {/* Entry Preview */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '400', 
                        marginBottom: 'var(--space-xs)',
                        color: 'var(--text-primary)',
                      }}>
                        {entry.title}
                      </h3>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--space-md)', 
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                      }}>
                        {entry.mood && <span>{moodEmojis[entry.mood]}</span>}
                        <span>{entry.wordCount} words</span>
                        <span>{entry.readingTime} min</span>
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div style={{ marginTop: 'var(--space-xs)', display: 'flex', gap: '4px' }}>
                          {entry.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)', maxWidth: '800px', margin: '0 auto' }}>
            <div className="zen-card">
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>total entries</h3>
              <p style={{ fontSize: '2rem', fontWeight: '300', color: 'var(--twilight-purple)' }}>{entries.length}</p>
            </div>
            
            <div className="zen-card">
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>words written</h3>
              <p style={{ fontSize: '2rem', fontWeight: '300', color: 'var(--moss-green)' }}>
                {entries.reduce((acc, entry) => acc + entry.wordCount, 0).toLocaleString()}
              </p>
            </div>
            
            <div className="zen-card">
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>writing streak</h3>
              <p style={{ fontSize: '2rem', fontWeight: '300', color: 'var(--amber-glow)' }}>7 days</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
