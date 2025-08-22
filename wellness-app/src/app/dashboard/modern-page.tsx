'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Brain, 
  Timer, 
  Trophy, 
  TrendingUp, 
  Sparkles,
  Target,
  Heart,
  Activity,
  RefreshCw,
  ChevronRight,
  Calendar,
  Flame,
  Zap,
  Users,
  Clock,
  ArrowUp,
  Smile,
  Star,
  Moon,
  Sun
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { ModernCard, StatCard, ActivityCard } from '@/components/ui/ModernCard';
import ActivityGraph from '@/components/ActivityGraph';
import '@/styles/modern-theme.css';

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

export default function ModernDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [loadingAffirmations, setLoadingAffirmations] = useState(true);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Mock data for demonstration
  const mockActivities = [
    { id: '1', user: 'Max Stone', action: 'Completed 45 min focus', time: '2m ago', isOnline: true },
    { id: '2', user: 'Kristin Watson', action: 'Started morning routine', time: '15m ago', isOnline: true },
    { id: '3', user: 'Levi Patrick', action: 'Achieved 7-day streak', time: '1h ago', isOnline: false },
    { id: '4', user: 'Emily Chen', action: 'Shared an affirmation', time: '2h ago', isOnline: true },
    { id: '5', user: 'Alex Morgan', action: 'Completed wellness check', time: '3h ago', isOnline: false },
  ];

  const weekData = [65, 78, 82, 74, 88, 92, 85];
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
      setLoadingAffirmations(true);
      const response = await fetch('/api/affirmations/daily', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch affirmations');
      }

      const data = await response.json();
      setAffirmations(data.affirmations || []);
      setCurrentAffirmationIndex(0);
    } catch (error) {
      console.error('Error fetching affirmations:', error);
      setAffirmations([
        "You are capable of amazing things.",
        "Today is full of possibilities.",
        "You have the strength to overcome any challenge.",
      ]);
    } finally {
      setLoadingAffirmations(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/stats/daily', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        today: { affirmationsViewed: 0, sessionMinutes: 0, streakCount: 0 },
        currentStreak: 0,
        week: [],
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleNextAffirmation = async () => {
    if (affirmations.length > 0) {
      const nextIndex = (currentAffirmationIndex + 1) % affirmations.length;
      setCurrentAffirmationIndex(nextIndex);
      
      if (stats) {
        setStats({
          ...stats,
          today: {
            ...stats.today,
            affirmationsViewed: stats.today.affirmationsViewed + 1,
          },
        });
      }
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Good Morning', icon: Sun };
    if (hour < 18) return { greeting: 'Good Afternoon', icon: Sun };
    return { greeting: 'Good Evening', icon: Moon };
  };

  const { greeting, icon: TimeIcon } = getTimeOfDay();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50">
        <div className="animate-pulse">
          <Heart className="h-12 w-12 text-purple-500" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <Sidebar />
      
      {/* Main Content */}
      <div className="lg:ml-24">
        {/* Header */}
        <header className="bg-white/60 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-20">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TimeIcon className="h-6 w-6 text-amber-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {greeting}, {user?.name?.split(' ')[0] || 'there'}!
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2.5 rounded-xl bg-white/80 hover:bg-gray-50 transition-all duration-200 shadow-sm">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button className="p-2.5 rounded-xl bg-white/80 hover:bg-gray-50 transition-all duration-200 shadow-sm relative">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>
                <div className="relative group">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold cursor-pointer shadow-lg shadow-purple-500/20 transition-transform duration-200 hover:scale-105">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Top Row - Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard
              title="Current Streak"
              value={`${stats?.currentStreak || 0} days`}
              subtitle="Keep it going!"
              icon={<Flame className="w-5 h-5" />}
              trend={12}
              color="purple"
            />
            <StatCard
              title="Focus Time"
              value={`${stats?.today.sessionMinutes || 0} min`}
              subtitle="Today's total"
              icon={<Clock className="w-5 h-5" />}
              trend={8}
              color="blue"
            />
            <StatCard
              title="Affirmations"
              value={stats?.today.affirmationsViewed || 0}
              subtitle="Viewed today"
              icon={<Sparkles className="w-5 h-5" />}
              trend={-5}
              color="pink"
            />
            <StatCard
              title="Wellness Score"
              value="85%"
              subtitle="Above average"
              icon={<Heart className="w-5 h-5" />}
              trend={15}
              color="green"
            />
          </div>

          {/* Middle Row - Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Activity Overview */}
            <div className="lg:col-span-2">
              <ModernCard className="h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
                    <p className="text-sm text-gray-500 mt-1">Your wellness journey this week</p>
                  </div>
                  <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                    <option>This Week</option>
                    <option>Last Week</option>
                    <option>This Month</option>
                  </select>
                </div>
                <ActivityGraph 
                  data={weekData} 
                  labels={weekLabels} 
                  height={220}
                  color="purple"
                />
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">748</p>
                    <p className="text-xs text-gray-500 mt-1">Total Minutes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">9.2k</p>
                    <p className="text-xs text-gray-500 mt-1">Steps Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">92%</p>
                    <p className="text-xs text-gray-500 mt-1">Goal Progress</p>
                  </div>
                </div>
              </ModernCard>
            </div>

            {/* Daily Affirmation */}
            <ModernCard variant="gradient" gradient="purple" className="text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Daily Affirmation</h3>
                  <button 
                    onClick={handleNextAffirmation}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-lg leading-relaxed">
                    "{affirmations[currentAffirmationIndex] || 'Loading...'}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <span className="text-sm opacity-80">
                      {currentAffirmationIndex + 1} of {affirmations.length}
                    </span>
                    <Link href="/focus">
                      <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                        Start Focus Session →
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </ModernCard>
          </div>

          {/* Bottom Row - Quick Actions & Friends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <ModernCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Link href="/focus">
                    <div className="group cursor-pointer">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 transition-all duration-200">
                        <Timer className="w-8 h-8 text-purple-600 mb-3" />
                        <p className="text-sm font-medium text-gray-900">Focus Timer</p>
                        <p className="text-xs text-gray-500 mt-1">Start a session</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/wellness">
                    <div className="group cursor-pointer">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 group-hover:from-blue-100 group-hover:to-cyan-100 transition-all duration-200">
                        <Heart className="w-8 h-8 text-blue-600 mb-3" />
                        <p className="text-sm font-medium text-gray-900">Wellness Check</p>
                        <p className="text-xs text-gray-500 mt-1">How are you?</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/progress">
                    <div className="group cursor-pointer">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-200">
                        <Trophy className="w-8 h-8 text-green-600 mb-3" />
                        <p className="text-sm font-medium text-gray-900">View Progress</p>
                        <p className="text-xs text-gray-500 mt-1">See achievements</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </ModernCard>
            </div>

            {/* Friends Activity */}
            <ActivityCard 
              title="Friends"
              activities={mockActivities}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
