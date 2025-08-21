'use client';

import React, { useState } from 'react';
import { User, Target, Heart, Clock, Bell, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  goals: string[];
  healthConditions: string[];
  tone: string;
  notificationTimes: string[];
  focusSessionLength: number;
  customGoal?: string;
  customCondition?: string;
}

const HEALTH_CONDITIONS = [
  { id: 'anxiety', label: 'Anxiety', description: 'Managing worry and nervous feelings' },
  { id: 'ocd', label: 'OCD', description: 'Obsessive-compulsive thoughts and behaviors' },
  { id: 'pcos', label: 'PCOS', description: 'Polycystic ovary syndrome support' },
  { id: 'pms', label: 'PMS', description: 'Premenstrual syndrome management' },
  { id: 'adhd', label: 'ADHD', description: 'Attention and focus challenges' },
  { id: 'depression', label: 'Depression', description: 'Low mood and mental health support' },
];

const COMMON_GOALS = [
  { id: 'self-compassion', label: 'Self-Compassion', description: 'Being kinder to yourself' },
  { id: 'stress-management', label: 'Stress Management', description: 'Better coping with daily stress' },
  { id: 'focus-productivity', label: 'Focus & Productivity', description: 'Improving concentration and work habits' },
  { id: 'confidence', label: 'Confidence Building', description: 'Boosting self-esteem and self-worth' },
  { id: 'health-wellness', label: 'Health & Wellness', description: 'Supporting physical and mental health' },
  { id: 'relationships', label: 'Better Relationships', description: 'Improving connections with others' },
];

const TONES = [
  { id: 'encouraging', label: 'Encouraging & Uplifting', description: '🌟 Positive and supportive messages', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { id: 'motivational', label: 'Motivational & Driven', description: '🔥 Action-oriented and energizing', color: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'gentle', label: 'Gentle & Compassionate', description: '🌸 Soft and understanding approach', color: 'bg-pink-100 text-pink-700 border-pink-300' },
];

export const ProfileSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    goals: [],
    healthConditions: [],
    tone: 'encouraging',
    notificationTimes: ['09:00', '15:00'],
    focusSessionLength: 25,
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const totalSteps = 5;

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

  const handleGoalToggle = (goalId: string) => {
    setProfileData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(id => id !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const handleConditionToggle = (conditionId: string) => {
    setProfileData(prev => ({
      ...prev,
      healthConditions: prev.healthConditions.includes(conditionId)
        ? prev.healthConditions.filter(id => id !== conditionId)
        : [...prev.healthConditions, conditionId]
    }));
  };

  const handleCustomGoal = (goal: string) => {
    if (goal.trim()) {
      setProfileData(prev => ({
        ...prev,
        goals: [...prev.goals.filter(g => !g.startsWith('custom-')), `custom-${goal.trim()}`]
      }));
    }
  };

  const handleCustomCondition = (condition: string) => {
    if (condition.trim()) {
      setProfileData(prev => ({
        ...prev,
        healthConditions: [...prev.healthConditions.filter(c => !c.startsWith('custom-')), `custom-${condition.trim()}`]
      }));
    }
  };

  const handleTimeToggle = (time: string) => {
    setProfileData(prev => ({
      ...prev,
      notificationTimes: prev.notificationTimes.includes(time)
        ? prev.notificationTimes.filter(t => t !== time)
        : [...prev.notificationTimes, time]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Profile setup error:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return profileData.goals.length > 0;
      case 2: return true; // Health conditions are optional
      case 3: return profileData.tone !== '';
      case 4: return profileData.notificationTimes.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-500 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Set Up Your Profile</h1>
            <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {/* Step 1: Goals */}
          {currentStep === 1 && (
            <div>
              <div className="text-center mb-6">
                <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">What are your goals?</h2>
                <p className="text-gray-600">Select what youd like to work on (choose multiple)</p>
              </div>

              <div className="space-y-3 mb-6">
                {COMMON_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      profileData.goals.includes(goal.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        profileData.goals.includes(goal.id) ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      }`}>
                        {profileData.goals.includes(goal.id) && (
                          <Check className="w-3 h-3 text-white mx-auto mt-0.5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{goal.label}</h3>
                        <p className="text-sm text-gray-600">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or add your own goal:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Better sleep habits, Career transition..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onBlur={(e) => handleCustomGoal(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Health Conditions */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-6">
                <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Health & Wellness Areas</h2>
                <p className="text-gray-600">Optional: Select any areas youd like specialized support with</p>
              </div>

              <div className="space-y-3 mb-6">
                {HEALTH_CONDITIONS.map((condition) => (
                  <button
                    key={condition.id}
                    onClick={() => handleConditionToggle(condition.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      profileData.healthConditions.includes(condition.id)
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        profileData.healthConditions.includes(condition.id) ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
                      }`}>
                        {profileData.healthConditions.includes(condition.id) && (
                          <Check className="w-3 h-3 text-white mx-auto mt-0.5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{condition.label}</h3>
                        <p className="text-sm text-gray-600">{condition.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or add your own:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Chronic pain, Eating disorder recovery..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                  onBlur={(e) => handleCustomCondition(e.target.value)}
                />
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 This helps us provide more relevant affirmations, but you can always adjust these later.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Tone Selection */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-6">
                <User className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Tone</h2>
                <p className="text-gray-600">How would you like your affirmations to feel?</p>
              </div>

              <div className="space-y-4">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setProfileData(prev => ({ ...prev, tone: tone.id }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      profileData.tone === tone.id
                        ? tone.color.replace('100', '50').replace('300', '500')
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        profileData.tone === tone.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                      }`}>
                        {profileData.tone === tone.id && (
                          <Check className="w-3 h-3 text-white mx-auto mt-0.5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{tone.label}</h3>
                        <p className="text-sm text-gray-600">{tone.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Notifications */}
          {currentStep === 4 && (
            <div>
              <div className="text-center mb-6">
                <Bell className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Reminders</h2>
                <p className="text-gray-600">When would you like to receive your affirmations?</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeToggle(time)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      profileData.notificationTimes.includes(time)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-sm font-medium">{time}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">
                  💡 You can always change these notification times later in your settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Focus Settings */}
          {currentStep === 5 && (
            <div>
              <div className="text-center mb-6">
                <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Focus Sessions</h2>
                <p className="text-gray-600">Set your preferred focus session length</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Focus Session Length
                  </label>
                  <select
                    value={profileData.focusSessionLength}
                    onChange={(e) => setProfileData(prev => ({ ...prev, focusSessionLength: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 minutes - Quick focus</option>
                    <option value={25}>25 minutes - Pomodoro standard</option>
                    <option value={45}>45 minutes - Deep work</option>
                    <option value={60}>60 minutes - Extended focus</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">What youll get:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Personalized daily affirmations</li>
                    <li>• Focus timer with ambient sounds</li>
                    <li>• Progress tracking and insights</li>
                    <li>• Customizable notifications</li>
                    <li>• Health-specific support content</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <div className="flex items-center space-x-2">
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};