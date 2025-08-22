'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/zen-dark.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [zenMoment, setZenMoment] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  
  const zenMoments = [
    "welcome back to your sanctuary",
    "your journey continues here",
    "breathe, center, begin",
    "mindfulness awaits",
    "return to your practice",
  ];
  
  useEffect(() => {
    setZenMoment(zenMoments[Math.floor(Math.random() * zenMoments.length)]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background)', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: 'var(--space-lg)'
    }}>
      {/* Decorative circles */}
      <div className="zen-circle" style={{ top: '10%', left: '5%', width: '150px', height: '150px', opacity: 0.05 }}></div>
      <div className="zen-circle imperfect" style={{ bottom: '20%', right: '10%', width: '100px', height: '100px', opacity: 0.05 }}></div>
      
      <div className="zen-card zen-card-organic" style={{ 
        width: '100%',
        maxWidth: '420px',
        padding: 'var(--space-xl)',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 className="zen-heading-playful" style={{ 
            fontSize: '2.5rem',
            marginBottom: 'var(--space-xs)'
          }}>
            zenn
          </h1>
        </Link>
        
        <p style={{ 
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          marginBottom: 'var(--space-lg)',
          fontStyle: 'italic'
        }}>
          "{zenMoment}"
        </p>
        
        <h2 style={{ 
          color: 'var(--text-primary)',
          fontSize: '1.5rem',
          fontWeight: 300,
          marginBottom: 'var(--space-xl)'
        }}>
          welcome back
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-lg)', textAlign: 'left' }}>
            <label style={{ 
              display: 'block',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-xs)',
              letterSpacing: '0.05em'
            }}>
              email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--sakura-pink)';
                e.target.style.boxShadow = '0 0 0 3px rgba(212, 130, 143, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: 'var(--space-xl)', textAlign: 'left' }}>
            <label style={{ 
              display: 'block',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-xs)',
              letterSpacing: '0.05em'
            }}>
              password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--sakura-pink)';
                e.target.style.boxShadow = '0 0 0 3px rgba(212, 130, 143, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="zen-button-playful"
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              fontSize: '1rem',
              marginBottom: 'var(--space-lg)',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
                <span className="floating" style={{ display: 'inline-block' }}>◌</span>
                returning to your space...
              </span>
            ) : (
              'enter your sanctuary'
            )}
          </button>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            justifyContent: 'center',
            marginBottom: 'var(--space-md)'
          }}>
            <span style={{ height: '1px', flex: 1, background: 'var(--border)' }}></span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or</span>
            <span style={{ height: '1px', flex: 1, background: 'var(--border)' }}></span>
          </div>
          
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            new to this journey?{' '}
            <Link href="/register" style={{ 
              color: 'var(--ocean-blue)',
              textDecoration: 'none',
              borderBottom: '1px dotted var(--ocean-blue)'
            }}>
              create your space
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
