'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import SphereTimer from '@/components/SphereTimer';
import Sidebar from '@/components/Sidebar';
import { ModernCard } from '@/components/ui/ModernCard';
import '@/styles/modern-theme.css';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Brain,
  Timer,
  Coffee,
  Zap,
  Moon,
  CheckCircle,
  Settings2,
  Sparkles,
  Target,
  Music,
  Wind,
  Waves,
  Trees
} from 'lucide-react';

const SESSION_PRESETS = [
  { id: 'focus', name: 'Deep Focus', duration: 25, icon: Brain, color: 'from-purple-500 to-pink-500' },
  { id: 'short', name: 'Quick Session', duration: 10, icon: Zap, color: 'from-blue-500 to-cyan-500' },
  { id: 'pomodoro', name: 'Pomodoro', duration: 25, icon: Timer, color: 'from-orange-500 to-red-500' },
  { id: 'break', name: 'Break Time', duration: 5, icon: Coffee, color: 'from-green-500 to-emerald-500' },
  { id: 'meditation', name: 'Meditation', duration: 15, icon: Sparkles, color: 'from-indigo-500 to-purple-500' },
  { id: 'long', name: 'Long Focus', duration: 45, icon: Target, color: 'from-pink-500 to-rose-500' },
];

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'No Sound', icon: VolumeX },
  { id: 'rain', name: 'Rain', icon: Wind },
  { id: 'ocean', name: 'Ocean Waves', icon: Waves },
  { id: 'forest', name: 'Forest', icon: Trees },
  { id: 'lofi', name: 'Lo-Fi Music', icon: Music },
];

export default function ModernFocusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Timer state
  const [selectedPreset, setSelectedPreset] = useState('focus');
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  
  // Sound state
  const [ambientSound, setAmbientSound] = useState('none');
  const [isMuted, setIsMuted] = useState(false);
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!isMuted) {
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
    
    // Save session
    try {
      await fetch('/api/focus-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          duration: Math.ceil(duration),
          type: selectedPreset,
          ambientSound: ambientSound === 'none' ? null : ambientSound,
        }),
      });
      
      toast.success('🎉 Session completed! Great work!', {
        description: `You've completed a ${duration}-minute session.`,
      });
    } catch (error) {
      console.error('Failed to save session:', error);
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

  const handlePresetChange = (presetId: string) => {
    const preset = SESSION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setDuration(preset.duration);
      setTimeLeft(preset.duration * 60);
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
  const currentPreset = SESSION_PRESETS.find((p) => p.id === selectedPreset);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50">
        <div className="animate-pulse">
          <Brain className="h-12 w-12 text-purple-500" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <Sidebar />
      
      <div className="lg:ml-24">
        {/* Header */}
        <header className="bg-white/60 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-20">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Focus Session</h1>
                <p className="text-sm text-gray-500 mt-0.5">Stay focused and achieve your goals</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">{completedSessions} completed today</span>
                </div>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2.5 rounded-xl bg-white/80 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timer Section */}
              <div className="lg:col-span-2">
                <ModernCard className="h-full flex flex-col">
                  {/* Timer Display */}
                  <div className="flex-1 flex items-center justify-center py-8">
                    <SphereTimer 
                      progress={progress}
                      timeLeft={formatTime(timeLeft)}
                      isRunning={isRunning}
                      isPaused={isPaused}
                    />
                  </div>

                  {/* Controls */}
                  <div className="space-y-6 pb-2">
                    <div className="flex justify-center gap-4">
                      {!isRunning ? (
                        <button
                          onClick={handleStart}
                          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                        >
                          <Play className="w-5 h-5" />
                          Start Session
                        </button>
                      ) : (
                        <button
                          onClick={handlePause}
                          className={`px-8 py-3 ${isPaused ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/25' : 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-500/25'} text-white rounded-full font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2`}
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-5 h-5" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-5 h-5" />
                              Pause
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={handleReset}
                        className="px-8 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-full font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Reset
                      </button>
                    </div>

                    {/* Session Presets */}
                    <div className="grid grid-cols-3 gap-3 px-4">
                      {SESSION_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const isActive = selectedPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => handlePresetChange(preset.id)}
                            className={`relative p-4 rounded-2xl transition-all duration-200 ${
                              isActive 
                                ? 'bg-gradient-to-br ' + preset.color + ' text-white shadow-lg transform scale-105' 
                                : 'bg-white/60 hover:bg-white/80 text-gray-700 border border-gray-200'
                            }`}
                          >
                            <Icon className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-xs font-medium">{preset.name}</p>
                            <p className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                              {preset.duration} min
                            </p>
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </ModernCard>
              </div>

              {/* Settings & Info */}
              <div className="space-y-6">
                {/* Ambient Sounds */}
                <ModernCard>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Music className="w-5 h-5 text-purple-500" />
                    Ambient Sounds
                  </h3>
                  <div className="space-y-2">
                    {AMBIENT_SOUNDS.map((sound) => {
                      const Icon = sound.icon;
                      const isActive = ambientSound === sound.id;
                      return (
                        <button
                          key={sound.id}
                          onClick={() => setAmbientSound(sound.id)}
                          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                            isActive 
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 border' 
                              : 'bg-white/50 hover:bg-white/80 border border-gray-200'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                          <span className={`text-sm font-medium ${isActive ? 'text-purple-900' : 'text-gray-700'}`}>
                            {sound.name}
                          </span>
                          {isActive && (
                            <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ModernCard>

                {/* Today's Progress */}
                <ModernCard>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    Today's Progress
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Sessions</span>
                        <span className="font-medium">{completedSessions}/4</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((completedSessions / 4) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Focus Time</span>
                        <span className="font-medium">{completedSessions * 25} min</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((completedSessions * 25 / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </ModernCard>

                {/* Motivational Quote */}
                <ModernCard variant="gradient" gradient="purple" className="text-white">
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 text-white/80" />
                    <p className="text-sm italic leading-relaxed">
                      "The secret of getting ahead is getting started."
                    </p>
                    <p className="text-xs mt-2 text-white/60">- Mark Twain</p>
                  </div>
                </ModernCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
