'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Sparkles, Brain, Target, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // If user is logged in, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="h-12 w-12 text-purple-500" />
        </div>
      </div>
    );
  }

  // Show landing page if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
                <Heart className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Your Personal Wellness Companion
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Daily affirmations, focus sessions, and mindfulness exercises tailored just for you
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Transform Your Daily Routine</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Daily Affirmations</h3>
              <p className="text-gray-600 text-center">
                Personalized positive affirmations based on your goals and health conditions
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Focus Sessions</h3>
              <p className="text-gray-600 text-center">
                Pomodoro timer, meditation sessions, and ambient sounds for deep work
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Progress Tracking</h3>
              <p className="text-gray-600 text-center">
                Track your wellness journey with streaks, statistics, and insights
              </p>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Wellness App?</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {[
                'Customized to your specific health conditions and goals',
                'Science-backed techniques for mental wellness',
                'Beautiful, calming interface designed for daily use',
                'Track your progress and build healthy habits',
                'Private and secure - your data stays yours',
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                  <p className="text-lg text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Start Your Wellness Journey Today</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands who have transformed their daily routine
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
