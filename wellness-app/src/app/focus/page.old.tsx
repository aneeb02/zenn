'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import SphereTimer from '@/components/SphereTimer';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  ChevronLeft,
  Brain,
  Timer,
  Coffee,
  Zap,
  Moon,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

const SESSION_TYPES = [
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer, duration: 25, description: 'Focus for 25 minutes' },
  { id: 'short-break', label: 'Short Break', icon: Coffee, duration: 5, description: 'Quick 5-minute break' },
  { id: 'long-break', label: 'Long Break', icon: Coffee, duration: 15, description: '15-minute rest' },
  { id: 'meditation', label: 'Meditation', icon: Brain, duration: 10, description: 'Mindful breathing' },
  { id: 'deep-work', label: 'Deep Work', icon: Zap, duration: 45, description: 'Extended focus session' },
  { id: 'custom', label: 'Custom', icon: Timer, duration: 25, description: 'Set your own time' },
];

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'No Sound', icon: VolumeX },
  { id: 'rain', label: 'Rain', icon: Volume2 },
  { id: 'ocean', label: 'Ocean Waves', icon: Volume2 },
  { id: 'forest', label: 'Forest', icon: Volume2 },
  { id: 'white-noise', label: 'White Noise', icon: Volume2 },
  { id: 'meditation', label: 'Meditation Music', icon: Volume2 },
];

export default function FocusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Timer state
  const [sessionType, setSessionType] = useState('pomodoro');
  const [duration, setDuration] = useState(25); // in minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  
  // Sound state
  const [ambientSound, setAmbientSound] = useState('none');
  const [isMuted, setIsMuted] = useState(false);
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize with user's default session length
  useEffect(() => {
    if (user?.profile?.focusSessionLength) {
      setDuration(user.profile.focusSessionLength);
      setTimeLeft(user.profile.focusSessionLength * 60);
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Timer logic
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
    
    // Play completion sound
    playCompletionSound();
    
    // Save session to database
    try {
      await fetch('/api/focus-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          duration: Math.ceil(duration),
          type: sessionType,
          ambientSound: ambientSound === 'none' ? null : ambientSound,
        }),
      });
      
      toast.success('🎉 Session completed! Great work!', {
        description: `You've completed a ${duration}-minute ${sessionType} session.`,
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const playCompletionSound = () => {
    if (!isMuted) {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration * 60);
  };

  const handleSessionTypeChange = (type: string) => {
    const session = SESSION_TYPES.find((s) => s.id === type);
    if (session) {
      setSessionType(type);
      if (type !== 'custom') {
        setDuration(session.duration);
        setTimeLeft(session.duration * 60);
      }
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const handleDurationChange = (newDuration: string) => {
    const minutes = parseInt(newDuration);
    if (!isNaN(minutes) && minutes > 0 && minutes <= 180) {
      setDuration(minutes);
      setTimeLeft(minutes * 60);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Brain className="h-12 w-12 text-purple-500" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentSession = SESSION_TYPES.find((s) => s.id === sessionType);
  const Icon = currentSession?.icon || Timer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-indigo-500" />
              <h1 className="text-xl font-bold">Focus Session</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <CheckCircle className="h-3 w-3 mr-1" />
              {completedSessions} completed today
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Timer Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-6 w-6 text-indigo-500" />
                  <CardTitle>{currentSession?.label} Session</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              <CardDescription>{currentSession?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 3D Sphere Timer Display */}
              <SphereTimer 
                progress={progress}
                timeLeft={formatTime(timeLeft)}
                isRunning={isRunning}
                isPaused={isPaused}
              />

              {/* Control Buttons */}
              <div className="flex justify-center gap-4">
                {!isRunning ? (
                  <Button size="lg" onClick={handleStart} className="px-8">
                    <Play className="h-5 w-5 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={handlePause}
                    variant={isPaused ? "default" : "secondary"}
                    className="px-8"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Session Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                {SESSION_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    variant={sessionType === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSessionTypeChange(type.id)}
                    className="flex flex-col h-auto py-2"
                  >
                    <type.icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{type.label}</span>
                    <span className="text-xs opacity-60">{type.duration}m</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Custom Duration */}
              {sessionType === 'custom' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Select value={duration.toString()} onValueChange={handleDurationChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map((min) => (
                        <SelectItem key={min} value={min.toString()}>
                          {min} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Ambient Sound */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ambient Sound</label>
                <Select value={ambientSound} onValueChange={setAmbientSound}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AMBIENT_SOUNDS.map((sound) => (
                      <SelectItem key={sound.id} value={sound.id}>
                        <div className="flex items-center gap-2">
                          <sound.icon className="h-4 w-4" />
                          <span>{sound.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tips */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="text-sm font-medium">Focus Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Eliminate distractions</li>
                  <li>• Keep water nearby</li>
                  <li>• Take breaks between sessions</li>
                  <li>• Maintain good posture</li>
                </ul>
              </div>

              {/* Quick Affirmation */}
              <div className="pt-4 border-t">
                <p className="text-sm italic text-center text-muted-foreground">
                  "Focus on progress, not perfection."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
