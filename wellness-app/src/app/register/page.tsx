'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/zen-dark.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [zenMoment, setZenMoment] = useState('');
  const { register } = useAuth();
  
  const zenMoments = [
    "begin with a single breath",
    "your wellness journey starts now",
    "plant the seeds of mindfulness",
    "create your peaceful sanctuary",
    "welcome to a gentler way of being",
  ];
  
  useEffect(() => {
    setZenMoment(zenMoments[Math.floor(Math.random() * zenMoments.length)]);
  }, []);

  const validatePassword = (pass: string) => {
    const errors = [];
    if (pass.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(pass)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(pass)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(pass)) errors.push('one number');
    
    if (errors.length > 0) {
      setPasswordError(`Password must contain ${errors.join(', ')}`);
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background)', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: 'var(--space-lg)',
      overflowY: 'auto'
    }}>
      {/* Decorative circles */}
      <div className="zen-circle" style={{ top: '5%', right: '8%', width: '120px', height: '120px', opacity: 0.05 }}></div>
      <div className="zen-circle imperfect" style={{ bottom: '10%', left: '5%', width: '180px', height: '180px', opacity: 0.03 }}></div>
      
      <div className="zen-card zen-card-organic" style={{ 
        width: '100%',
        maxWidth: '480px',
        padding: 'var(--space-xl)',
        textAlign: 'center',
        margin: 'var(--space-lg) 0'
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
          create your sanctuary
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
              your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              placeholder="how shall we address you?"
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
                e.target.style.borderColor = 'var(--moss-green)';
                e.target.style.boxShadow = '0 0 0 3px rgba(122, 154, 126, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
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
                e.target.style.borderColor = 'var(--moss-green)';
                e.target.style.boxShadow = '0 0 0 3px rgba(122, 154, 126, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: 'var(--space-md)', textAlign: 'left' }}>
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
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              required
              disabled={isLoading}
              placeholder="choose wisely"
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
                e.target.style.borderColor = 'var(--moss-green)';
                e.target.style.boxShadow = '0 0 0 3px rgba(122, 154, 126, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {password && (
              <div style={{ 
                marginTop: 'var(--space-sm)',
                padding: 'var(--space-sm)',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem'
              }}>
                {passwordRequirements.map((req, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-xs)',
                    marginBottom: index < passwordRequirements.length - 1 ? '4px' : 0
                  }}>
                    <span style={{ 
                      color: req.met ? 'var(--moss-green)' : 'var(--text-muted)',
                      fontSize: '0.9rem'
                    }}>
                      {req.met ? '✓' : '○'}
                    </span>
                    <span style={{ 
                      color: req.met ? 'var(--text-secondary)' : 'var(--text-muted)' 
                    }}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: 'var(--space-lg)', textAlign: 'left' }}>
            <label style={{ 
              display: 'block',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-xs)',
              letterSpacing: '0.05em'
            }}>
              confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="once more for clarity"
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
                e.target.style.borderColor = 'var(--moss-green)';
                e.target.style.boxShadow = '0 0 0 3px rgba(122, 154, 126, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          {passwordError && (
            <p style={{ 
              color: 'var(--amber-glow)',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-lg)',
              textAlign: 'left'
            }}>
              ⚠ {passwordError}
            </p>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="zen-button-playful"
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              fontSize: '1rem',
              marginBottom: 'var(--space-lg)',
              background: 'var(--moss-green)',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
                <span className="floating" style={{ display: 'inline-block' }}>◌</span>
                creating your sanctuary...
              </span>
            ) : (
              'begin your journey'
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
            already on this path?{' '}
            <Link href="/login" style={{ 
              color: 'var(--ocean-blue)',
              textDecoration: 'none',
              borderBottom: '1px dotted var(--ocean-blue)'
            }}>
              welcome back
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
