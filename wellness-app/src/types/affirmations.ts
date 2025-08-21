export interface Affirmation {
  id: string;
  text: string;
  category: string;
  tone: string;
  healthCondition?: string;
  isCustom: boolean;
  createdAt: string;
}

export interface DailyStats {
  id: string;
  userId: string;
  date: string;
  affirmationsViewed: number;
  sessionMinutes: number;
  streakCount: number;
}

export interface FocusSession {
  id: string;
  userId: string;
  duration: number;
  type: string;
  ambientSound?: string;
  completedAt: string;
}