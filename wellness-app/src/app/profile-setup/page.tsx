'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Heart, 
  Target, 
  Sparkles, 
  Volume2, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Loader2
} from 'lucide-react';

const GOALS = [
  { id: 'reduce-stress', label: 'Reduce Stress', icon: '😌' },
  { id: 'improve-focus', label: 'Improve Focus', icon: '🎯' },
  { id: 'better-sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'boost-confidence', label: 'Boost Confidence', icon: '💪' },
  { id: 'manage-anxiety', label: 'Manage Anxiety', icon: '🧘' },
  { id: 'increase-productivity', label: 'Increase Productivity', icon: '⚡' },
  { id: 'self-compassion', label: 'Practice Self-Compassion', icon: '💖' },
  { id: 'mindfulness', label: 'Cultivate Mindfulness', icon: '🌸' },
];

const HEALTH_CONDITIONS = [
  { id: 'anxiety', label: 'Anxiety', description: 'Generalized or social anxiety' },
  { id: 'depression', label: 'Depression', description: 'Mood management support' },
  { id: 'adhd', label: 'ADHD', description: 'Attention and focus challenges' },
  { id: 'pcos', label: 'PCOS', description: 'Polycystic Ovary Syndrome' },
  { id: 'pms', label: 'PMS', description: 'Premenstrual symptoms' },
  { id: 'ocd', label: 'OCD', description: 'Obsessive-Compulsive patterns' },
  { id: 'chronic-pain', label: 'Chronic Pain', description: 'Ongoing pain management' },
  { id: 'insomnia', label: 'Insomnia', description: 'Sleep difficulties' },
  { id: 'none', label: 'None of the above', description: 'No specific conditions' },
];

const TONES = [
  { 
    id: 'gentle', 
    label: 'Gentle & Nurturing', 
    description: 'Soft, compassionate affirmations',
    example: '"You are doing your best, and that\'s enough"'
  },
  { 
    id: 'encouraging', 
    label: 'Encouraging & Supportive', 
    description: 'Uplifting and positive messages',
    example: '"You have the strength to overcome any challenge"'
  },
  { 
    id: 'motivational', 
    label: 'Motivational & Empowering', 
    description: 'Bold, action-oriented affirmations',
    example: '"You are unstoppable! Today is your day to shine!"'
  },
];

const NOTIFICATION_TIMES = [
  { id: 'morning', label: 'Morning', time: '08:00', icon: '🌅' },
  { id: 'midday', label: 'Midday', time: '12:00', icon: '☀️' },
  { id: 'evening', label: 'Evening', time: '18:00', icon: '🌆' },
  { id: 'night', label: 'Night', time: '21:00', icon: '🌙' },
];

const SESSION_LENGTHS = [
  { value: 5, label: '5 minutes', description: 'Quick reset' },
  { value: 10, label: '10 minutes', description: 'Short break' },
  { value: 15, label: '15 minutes', description: 'Standard session' },
  { value: 25, label: '25 minutes', description: 'Pomodoro session' },
  { value: 30, label: '30 minutes', description: 'Extended focus' },
  { value: 45, label: '45 minutes', description: 'Deep work' },
];

export default function ProfileSetupPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('gentle');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['morning']);
  const [sessionLength, setSessionLength] = useState(25);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    // Redirect if user already has a profile
    if (user?.profile) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleCondition = (conditionId: string) => {
    if (conditionId === 'none') {
      setSelectedConditions(['none']);
    } else {
      setSelectedConditions(prev => {
        const filtered = prev.filter(id => id !== 'none');
        return filtered.includes(conditionId)
          ? filtered.filter(id => id !== conditionId)
          : [...filtered, conditionId];
      });
    }
  };

  const toggleTime = (timeId: string) => {
    setSelectedTimes(prev => 
      prev.includes(timeId) 
        ? prev.filter(id => id !== timeId)
        : [...prev, timeId]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const profileData = {
        goals: selectedGoals,
        healthConditions: selectedConditions.filter(c => c !== 'none'),
        tone: selectedTone,
        notificationTimes: selectedTimes.map(id => {
          const time = NOTIFICATION_TIMES.find(t => t.id === id);
          return time?.time || '08:00';
        }),
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
      toast.success('Profile setup complete! Welcome to your wellness journey.');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
      console.error('Profile setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedGoals.length > 0;
      case 2: return selectedConditions.length > 0;
      case 3: return true; // Tone always has a selection
      case 4: return selectedTimes.length > 0;
      case 5: return true; // Session length always has a value
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-3xl mx-auto pt-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Setup Your Wellness Profile</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            {currentStep === 1 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-6 w-6 text-purple-500" />
                  <CardTitle>What are your wellness goals?</CardTitle>
                </div>
                <CardDescription>
                  Select all that apply. These will help us personalize your daily affirmations.
                </CardDescription>
              </>
            )}
            {currentStep === 2 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  <CardTitle>Any health conditions we should know about?</CardTitle>
                </div>
                <CardDescription>
                  This helps us provide more relevant and sensitive affirmations. Your data is private and secure.
                </CardDescription>
              </>
            )}
            {currentStep === 3 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                  <CardTitle>Choose your affirmation tone</CardTitle>
                </div>
                <CardDescription>
                  How would you like your affirmations to feel?
                </CardDescription>
              </>
            )}
            {currentStep === 4 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <CardTitle>When would you like to receive affirmations?</CardTitle>
                </div>
                <CardDescription>
                  Select your preferred times for daily reminders (you can change this later).
                </CardDescription>
              </>
            )}
            {currentStep === 5 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="h-6 w-6 text-green-500" />
                  <CardTitle>Default focus session length</CardTitle>
                </div>
                <CardDescription>
                  How long are your typical focus or meditation sessions?
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Goals */}
            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedGoals.includes(goal.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <span className="font-medium">{goal.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Health Conditions */}
            {currentStep === 2 && (
              <div className="space-y-3">
                {HEALTH_CONDITIONS.map((condition) => (
                  <button
                    key={condition.id}
                    onClick={() => toggleCondition(condition.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedConditions.includes(condition.id)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{condition.label}</div>
                        <div className="text-sm text-gray-600">{condition.description}</div>
                      </div>
                      {selectedConditions.includes(condition.id) && (
                        <Check className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Tone */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTone === tone.id
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{tone.label}</div>
                        {selectedTone === tone.id && (
                          <Check className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{tone.description}</div>
                      <div className="text-sm italic text-gray-500">{tone.example}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 4: Notification Times */}
            {currentStep === 4 && (
              <div className="grid grid-cols-2 gap-4">
                {NOTIFICATION_TIMES.map((time) => (
                  <button
                    key={time.id}
                    onClick={() => toggleTime(time.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTimes.includes(time.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-3xl">{time.icon}</div>
                      <div className="font-medium">{time.label}</div>
                      <div className="text-sm text-gray-600">{time.time}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 5: Session Length */}
            {currentStep === 5 && (
              <div className="space-y-4">
                {SESSION_LENGTHS.map((length) => (
                  <button
                    key={length.value}
                    onClick={() => setSessionLength(length.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      sessionLength === length.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{length.label}</div>
                        <div className="text-sm text-gray-600">{length.description}</div>
                      </div>
                      {sessionLength === length.value && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>

          <div className="p-6 border-t flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !canProceed()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Summary of selections */}
        {currentStep > 1 && (
          <Card className="mt-4 p-4">
            <div className="text-sm space-y-2">
              {selectedGoals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-muted-foreground">Goals:</span>
                  {selectedGoals.map(id => {
                    const goal = GOALS.find(g => g.id === id);
                    return goal && (
                      <Badge key={id} variant="secondary">
                        {goal.icon} {goal.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
              {currentStep > 2 && selectedConditions.length > 0 && selectedConditions[0] !== 'none' && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-muted-foreground">Conditions:</span>
                  {selectedConditions.map(id => {
                    const condition = HEALTH_CONDITIONS.find(c => c.id === id);
                    return condition && condition.id !== 'none' && (
                      <Badge key={id} variant="secondary">
                        {condition.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
              {currentStep > 3 && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground">Tone:</span>
                  <Badge variant="secondary">
                    {TONES.find(t => t.id === selectedTone)?.label}
                  </Badge>
                </div>
              )}
              {currentStep > 4 && selectedTimes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-muted-foreground">Reminders:</span>
                  {selectedTimes.map(id => {
                    const time = NOTIFICATION_TIMES.find(t => t.id === id);
                    return time && (
                      <Badge key={id} variant="secondary">
                        {time.icon} {time.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
