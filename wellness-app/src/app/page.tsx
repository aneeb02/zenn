'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import '@/styles/zen-dark.css';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Zen moments for the landing page - moved before any conditional returns
  const [zenMoment, setZenMoment] = useState('');
  const zenMoments = [
    "breathe in possibility, breathe out doubt",
    "your journey begins with a single moment",
    "find your center, find your peace",
    "wellness is not a destination, but a way of traveling",
    "今 (ima) - the present moment is all we have",
  ];

  useEffect(() => {
    if (!loading && user) {
      // If user is logged in, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    setZenMoment(zenMoments[Math.floor(Math.random() * zenMoments.length)]);
  }, []);

  // Show loading state while checking auth
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

  // Show landing page if not logged in
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div className="zen-circle" style={{ top: '5%', left: '10%', width: '200px', height: '200px', opacity: 0.05 }}></div>
        <div className="zen-circle imperfect" style={{ bottom: '15%', right: '5%', width: '150px', height: '150px', opacity: 0.05 }}></div>
        <div className="zen-circle" style={{ top: '50%', right: '15%', width: '100px', height: '100px', opacity: 0.03 }}></div>
        
        {/* Hero Section */}
        <div style={{ 
          padding: 'var(--space-2xl) var(--space-xl)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Logo/Brand */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h1 className="zen-heading-playful" style={{ 
                fontSize: 'clamp(3rem, 8vw, 5rem)',
                marginBottom: 'var(--space-sm)'
              }}>
                zenn
              </h1>
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '1rem',
                letterSpacing: '0.1em'
              }}>
                wellness • mindfulness • you
              </p>
            </div>
            
            {/* Main heading */}
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 200,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-lg)',
              lineHeight: 1.4
            }}>
              your personal space for<br/>
              <span style={{ color: 'var(--sakura-pink)' }}>mindful moments</span> & 
              <span style={{ color: 'var(--ocean-blue)' }}> daily wellness</span>
            </h2>
            
            <p style={{ 
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              marginBottom: 'var(--space-2xl)',
              fontStyle: 'italic'
            }}>
              `&quot;`{zenMoment}`&quot;`
            </p>
            
            {/* CTA Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: 'var(--space-md)', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link href="/register">
                <button className="zen-button-playful" style={{
                  padding: 'var(--space-md) var(--space-xl)',
                  fontSize: '1rem'
                }}>
                  begin your journey
                </button>
              </Link>
              <Link href="/login">
                <button className="zen-button" style={{
                  padding: 'var(--space-md) var(--space-xl)',
                  fontSize: '1rem'
                }}>
                  welcome back
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section style={{ 
          padding: 'var(--space-2xl) var(--space-xl)',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <p style={{ 
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              marginBottom: 'var(--space-2xl)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              what awaits you
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-lg)'
            }}>
              {/* Daily Affirmations */}
              <div className="zen-card zen-card-organic" style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: 'var(--space-md)',
                  filter: 'grayscale(0.3)'
                }}>
                  ✨
                </div>
                <h3 style={{ 
                  color: 'var(--sakura-pink)',
                  fontSize: '1.1rem',
                  marginBottom: 'var(--space-sm)',
                  fontWeight: 400
                }}>
                  daily affirmations
                </h3>
                <p style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}>
                  personalized mantras crafted for your unique journey & wellness goals
                </p>
              </div>
              
              {/* Focus Sessions */}
              <div className="zen-card zen-card-organic" style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: 'var(--space-md)',
                  filter: 'grayscale(0.3)'
                }}>
                  🧘
                </div>
                <h3 style={{ 
                  color: 'var(--ocean-blue)',
                  fontSize: '1.1rem',
                  marginBottom: 'var(--space-sm)',
                  fontWeight: 400
                }}>
                  focus sessions
                </h3>
                <p style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}>
                  timer, ambient sounds, and mindful breaks for deep work & meditation
                </p>
              </div>
              
              {/* Progress Tracking */}
              <div className="zen-card zen-card-organic" style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: 'var(--space-md)',
                  filter: 'grayscale(0.3)'
                }}>
                  🌱
                </div>
                <h3 style={{ 
                  color: 'var(--moss-green)',
                  fontSize: '1.1rem',
                  marginBottom: 'var(--space-sm)',
                  fontWeight: 400
                }}>
                  gentle progress
                </h3>
                <p style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}>
                  track your growth with kindness, celebrating each small victory
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section style={{ 
          padding: 'var(--space-2xl) var(--space-xl)',
          position: 'relative',
          zIndex: 2
        }}>
          <div className="zen-card" style={{ 
            maxWidth: '700px', 
            margin: '0 auto',
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%)'
          }}>
            <p style={{ 
              color: 'var(--amber-glow)',
              fontSize: '0.9rem',
              marginBottom: 'var(--space-md)',
              letterSpacing: '0.1em'
            }}>
              our philosophy
            </p>
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: 300,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-lg)',
              lineHeight: 1.5
            }}>
              wellness is not about perfection.<br/>
              its about <span style={{ fontStyle: 'italic', color: 'var(--sakura-pink)' }}>presence</span>.
            </h3>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
              alignItems: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.95rem'
            }}>
              <p>🌸 tailored to your unique health journey</p>
              <p>🍃 grounded in mindfulness practices</p>
              <p>🌙 designed for daily moments of peace</p>
              <p>💫 your data stays private & secure</p>
              <p>🎋 beautiful, minimal, calming</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ 
          padding: 'var(--space-2xl) var(--space-xl) var(--space-xl)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <p style={{ 
              fontSize: '1.3rem',
              fontWeight: 200,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-lg)',
              lineHeight: 1.6
            }}>
              ready to embrace a gentler,<br/>
              more mindful way of being?
            </p>
            
            <Link href="/register">
              <button className="zen-button-playful" style={{
                padding: 'var(--space-md) var(--space-xl)',
                fontSize: '1.1rem',
                marginBottom: 'var(--space-lg)'
              }}>
                start your journey →
              </button>
            </Link>
            
            <p style={{ 
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              no credit card required • free forever plan • cancel anytime
            </p>
          </div>
        </section>
        
        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          padding: 'var(--space-lg)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          borderTop: '1px solid var(--border)',
          position: 'relative',
          zIndex: 2
        }}>
          <p style={{ opacity: 0.5 }}>
            made with mindfulness • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    );
  }

  return null;
}
