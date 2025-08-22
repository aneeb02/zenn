'use client';

import { useEffect, useRef } from 'react';
import './SphereTimer.css';

interface SphereTimerProps {
  progress: number; // 0-100
  timeLeft: string;
  isRunning: boolean;
  isPaused: boolean;
}

export default function SphereTimer({ progress, timeLeft, isRunning, isPaused }: SphereTimerProps) {
  const sphereRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sphereRef.current) {
      // Update CSS variable for progress
      sphereRef.current.style.setProperty('--progress', `${progress}%`);
    }
  }, [progress]);

  return (
    <div className="sphere-timer-container">
      <div className="sphere-wrapper">
        {/* Progress ring positioned outside the sphere */}
        <div className="sphere-progress">
          <svg className="progress-ring" viewBox="0 0 320 320">
            <defs>
              <linearGradient id="sphereGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
                <stop offset="100%" stopColor="#e879f9" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            {/* Background circle - outer ring */}
            <circle
              className="progress-circle-bg"
              cx="160"
              cy="160"
              r="155"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="10"
            />
            
            {/* Progress circle - outer ring */}
            <circle
              className="progress-circle"
              cx="160"
              cy="160"
              r="155"
              fill="none"
              stroke="url(#sphereGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 155}`}
              strokeDashoffset={`${2 * Math.PI * 155 * (1 - progress / 100)}`}
              transform="rotate(-90 160 160)"
            />
          </svg>
        </div>
        
        <div 
          ref={sphereRef}
          className={`sphere ${isRunning && !isPaused ? 'animating' : ''}`}
        >
          {/* Gradient overlay that rotates around the sphere */}
          <div className="sphere-gradient" />
          
          {/* Inner content */}
          <div className="sphere-content">
            <div className="time-display">
              {timeLeft}
            </div>
            <div className="sphere-glow" />
          </div>
          
          {/* Floating particles */}
          <div className="particles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`} />
            ))}
          </div>
        </div>
        
        {/* Reflection */}
        <div className="sphere-reflection" />
      </div>
    </div>
  );
}
