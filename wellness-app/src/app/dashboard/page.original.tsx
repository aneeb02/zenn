'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, LogOut, Settings, Brain, Sparkles, TrendingUp, RefreshCw, Calendar, Clock, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

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

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [loadingAffirmations, setLoadingAffirmations] = useState(true);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      toast.error('Failed to load daily affirmations');
      // Set some default affirmations as fallback
      setAffirmations([
        "You are capable of amazing things.",
        "Today is full of possibilities.",
        "You have the strength to overcome any challenge.",
        "Your journey is unique and valuable.",
        "You deserve happiness and success."
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
      // Set default stats as fallback
      setStats({
        today: {
          affirmationsViewed: 0,
          sessionMinutes: 0,
          streakCount: 0,
        },
        currentStreak: 0,
        week: [],
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleNextAffirmation = async () => {
    if (affirmations.length > 0) {
      // Move to next affirmation
      const nextIndex = (currentAffirmationIndex + 1) % affirmations.length;
      setCurrentAffirmationIndex(nextIndex);
      
      // Update viewed count in stats locally
      if (stats) {
        setStats({
          ...stats,
          today: {
            ...stats.today,
            affirmationsViewed: stats.today.affirmationsViewed + 1,
          },
        });
      }
      
      // Save the viewed affirmation to track it (optional API call)
      try {
        // This could be an API call to track which specific affirmations were viewed
        // For now, the daily stats endpoint already tracks the count
        await fetch('/api/affirmations/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            affirmation: affirmations[nextIndex],
            index: nextIndex 
          }),
        });
      } catch (error) {
        // Silent fail for tracking, don't interrupt user experience
        console.log('Failed to track affirmation view');
      }
    }
  };

  const handleRefreshAffirmations = async () => {
    setRefreshing(true);
    await fetchDailyAffirmations();
    setRefreshing(false);
    toast.success('Affirmations refreshed!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="h-12 w-12 text-purple-500" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-purple-500" />
            <h1 className="text-xl font-bold">Wellness Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}!</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Today's Affirmation */}
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Today's Affirmation</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {currentAffirmationIndex + 1} / {affirmations.length || 12}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshAffirmations}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAffirmations ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <p className="text-lg text-center py-8 px-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg min-h-[140px] flex items-center justify-center">
                      "{affirmations[currentAffirmationIndex] || 'Loading your personalized affirmation...'}"
                    </p>
                    {user?.profile?.tone && (
                      <Badge className="absolute top-2 right-2" variant="outline">
                        {user.profile.tone === 'gentle' && '💝 Gentle'}
                        {user.profile.tone === 'encouraging' && '✨ Encouraging'}
                        {user.profile.tone === 'motivational' && '🔥 Motivational'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleNextAffirmation}
                      disabled={affirmations.length === 0}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Next Affirmation
                    </Button>
                    <Link href="/focus" className="flex-1">
                      <Button className="w-full">
                        <Brain className="h-4 w-4 mr-2" />
                        Start Focus Session
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle>Your Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>Current Streak</span>
                      </div>
                      <span className="font-bold text-lg">
                        {stats?.currentStreak || 0} {stats?.currentStreak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Focus Today</span>
                      </div>
                      <span className="font-bold text-lg">
                        {stats?.today.sessionMinutes || 0} min
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <span>Affirmations</span>
                      </div>
                      <span className="font-bold text-lg">
                        {stats?.today.affirmationsViewed || 0}
                      </span>
                    </div>
                  </div>
                  {stats?.week && stats.week.length > 0 && (
                    <div className="pt-2 mt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>This week: {stats.week.reduce((acc, day) => acc + day.sessionMinutes, 0)} minutes</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump into your wellness activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/focus">
                  <Button variant="outline" className="h-24 w-full flex-col gap-2">
                    <Brain className="h-8 w-8" />
                    <span>Focus Session</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-2"
                  onClick={handleRefreshAffirmations}
                >
                  <Sparkles className="h-8 w-8" />
                  <span>Daily Affirmations</span>
                </Button>
                <Link href="/settings">
                  <Button variant="outline" className="h-24 w-full flex-col gap-2">
                    <Settings className="h-8 w-8" />
                    <span>Settings</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
