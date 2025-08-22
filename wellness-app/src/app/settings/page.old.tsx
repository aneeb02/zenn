'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Settings, 
  User, 
  Heart, 
  Bell, 
  Target, 
  ChevronLeft,
  Plus,
  X,
  Save,
  Loader2,
  Sparkles,
  Clock
} from 'lucide-react';
import Link from 'next/link';

const PRESET_GOALS = [
  { id: 'reduce-stress', label: 'Reduce Stress', icon: '😌' },
  { id: 'improve-focus', label: 'Improve Focus', icon: '🎯' },
  { id: 'better-sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'boost-confidence', label: 'Boost Confidence', icon: '💪' },
  { id: 'manage-anxiety', label: 'Manage Anxiety', icon: '🧘' },
  { id: 'increase-productivity', label: 'Increase Productivity', icon: '⚡' },
  { id: 'self-compassion', label: 'Practice Self-Compassion', icon: '💖' },
  { id: 'mindfulness', label: 'Cultivate Mindfulness', icon: '🌸' },
];

const PRESET_CONDITIONS = [
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'depression', label: 'Depression' },
  { id: 'adhd', label: 'ADHD' },
  { id: 'pcos', label: 'PCOS' },
  { id: 'pms', label: 'PMS' },
  { id: 'ocd', label: 'OCD' },
  { id: 'chronic-pain', label: 'Chronic Pain' },
  { id: 'insomnia', label: 'Insomnia' },
];

const TONES = [
  { id: 'gentle', label: 'Gentle & Nurturing', icon: '💝' },
  { id: 'encouraging', label: 'Encouraging & Supportive', icon: '✨' },
  { id: 'motivational', label: 'Motivational & Empowering', icon: '🔥' },
];

const NOTIFICATION_TIMES = [
  { id: '08:00', label: 'Morning', icon: '🌅' },
  { id: '12:00', label: 'Midday', icon: '☀️' },
  { id: '18:00', label: 'Evening', icon: '🌆' },
  { id: '21:00', label: 'Night', icon: '🌙' },
];

export default function SettingsPage() {
  const { user, refreshUser, loading } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile state
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customConditions, setCustomConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  
  const [selectedTone, setSelectedTone] = useState('gentle');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [sessionLength, setSessionLength] = useState(25);
  
  // Account state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      // Load user data
      setName(user.name || '');
      setEmail(user.email);
      
      // Load profile data
      if (user.profile) {
        // Separate preset and custom goals
        const presetGoalIds = PRESET_GOALS.map(g => g.id);
        const userGoals = user.profile.goals || [];
        setSelectedGoals(userGoals.filter(g => presetGoalIds.includes(g)));
        setCustomGoals(userGoals.filter(g => !presetGoalIds.includes(g)));
        
        // Separate preset and custom conditions
        const presetConditionIds = PRESET_CONDITIONS.map(c => c.id);
        const userConditions = user.profile.healthConditions || [];
        setSelectedConditions(userConditions.filter(c => presetConditionIds.includes(c)));
        setCustomConditions(userConditions.filter(c => !presetConditionIds.includes(c)));
        
        setSelectedTone(user.profile.tone);
        setSelectedTimes(user.profile.notificationTimes || []);
        setSessionLength(user.profile.focusSessionLength);
      }
    }
  }, [user, loading, router]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const addCustomGoal = () => {
    if (newGoal.trim() && !customGoals.includes(newGoal.trim())) {
      setCustomGoals([...customGoals, newGoal.trim()]);
      setNewGoal('');
      toast.success('Custom goal added');
    }
  };

  const removeCustomGoal = (goal: string) => {
    setCustomGoals(customGoals.filter(g => g !== goal));
  };

  const toggleCondition = (conditionId: string) => {
    setSelectedConditions(prev => 
      prev.includes(conditionId) 
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const addCustomCondition = () => {
    if (newCondition.trim() && !customConditions.includes(newCondition.trim())) {
      setCustomConditions([...customConditions, newCondition.trim()]);
      setNewCondition('');
      toast.success('Custom condition added');
    }
  };

  const removeCustomCondition = (condition: string) => {
    setCustomConditions(customConditions.filter(c => c !== condition));
  };

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      const profileData = {
        goals: [...selectedGoals, ...customGoals],
        healthConditions: [...selectedConditions, ...customConditions],
        tone: selectedTone,
        notificationTimes: selectedTimes,
        focusSessionLength: sessionLength,
      };

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
      console.error('Profile save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Settings className="h-12 w-12 text-purple-500" />
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-purple-500" />
              <h1 className="text-xl font-bold">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Goals */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  <CardTitle>Wellness Goals</CardTitle>
                </div>
                <CardDescription>
                  Select your goals or add custom ones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preset Goals */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PRESET_GOALS.map((goal) => (
                    <Button
                      key={goal.id}
                      variant={selectedGoals.includes(goal.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleGoal(goal.id)}
                      className="justify-start"
                    >
                      <span className="mr-2">{goal.icon}</span>
                      <span className="text-xs">{goal.label}</span>
                    </Button>
                  ))}
                </div>
                
                {/* Custom Goals */}
                <div className="space-y-2">
                  <Label>Custom Goals</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add your own goal..."
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
                    />
                    <Button onClick={addCustomGoal} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customGoals.map((goal) => (
                      <Badge key={goal} variant="secondary" className="gap-1">
                        {goal}
                        <button onClick={() => removeCustomGoal(goal)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Conditions */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <CardTitle>Health Conditions</CardTitle>
                </div>
                <CardDescription>
                  Help us personalize your affirmations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preset Conditions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PRESET_CONDITIONS.map((condition) => (
                    <Button
                      key={condition.id}
                      variant={selectedConditions.includes(condition.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCondition(condition.id)}
                      className="text-xs"
                    >
                      {condition.label}
                    </Button>
                  ))}
                </div>
                
                {/* Custom Conditions */}
                <div className="space-y-2">
                  <Label>Custom Conditions</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add your own condition..."
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomCondition()}
                    />
                    <Button onClick={addCustomCondition} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customConditions.map((condition) => (
                      <Badge key={condition} variant="secondary" className="gap-1">
                        {condition}
                        <button onClick={() => removeCustomCondition(condition)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Affirmation Tone */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Affirmation Tone</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedTone === tone.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center space-y-1">
                        <div className="text-2xl">{tone.icon}</div>
                        <div className="font-medium text-sm">{tone.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Times */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <CardTitle>Reminder Times</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {NOTIFICATION_TIMES.map((time) => (
                    <button
                      key={time.id}
                      onClick={() => toggleTime(time.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedTimes.includes(time.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center space-y-1">
                        <div className="text-xl">{time.icon}</div>
                        <div className="text-xs font-medium">{time.label}</div>
                        <div className="text-xs text-gray-500">{time.id}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Focus Session Length */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <CardTitle>Default Focus Session Length</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[5, 10, 15, 25, 30, 45, 60].map((minutes) => (
                    <Button
                      key={minutes}
                      variant={sessionLength === minutes ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSessionLength(minutes)}
                    >
                      {minutes}m
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" />
                  <CardTitle>Account Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed at this time
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveProfile} 
            disabled={isSaving}
            size="lg"
            className="px-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
