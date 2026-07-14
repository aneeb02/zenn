import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Profile validation schemas
export const profileSchema = z.object({
  goals: z.array(z.string()).min(1, 'At least one goal is required').max(10),
  healthConditions: z.array(z.string()).max(10),
  tone: z.enum(['gentle', 'encouraging', 'motivational']),
  notificationTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')),
  focusSessionLength: z.number().min(5).max(120),
});

// Affirmation validation schemas
export const customAffirmationSchema = z.object({
  text: z.string()
    .min(5, 'Affirmation must be at least 5 characters')
    .max(500, 'Affirmation must be less than 500 characters'),
  category: z.string().default('personal'),
});

// Focus session validation schemas
export const focusSessionSchema = z.object({
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(240),
  type: z.enum(['deep-work', 'study-sprint', 'debug-mode', 'ship-it', 'reset-break', 'custom']).default('custom'),
  intention: z.string().max(240).optional(),
  ambientSound: z.string().nullable().optional(),
});

// Task validation schemas
export const taskStatusEnum = z.enum(['todo', 'doing', 'done']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  notes: z.string().max(2000).optional(),
  status: taskStatusEnum.optional().default('todo'),
  priority: z.number().int().min(0).max(3).optional().default(0),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD').nullable().optional(),
  estimateMins: z.number().int().min(0).max(1440).nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).nullable().optional(),
  status: taskStatusEnum.optional(),
  priority: z.number().int().min(0).max(3).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD').nullable().optional(),
  estimateMins: z.number().int().min(0).max(1440).nullable().optional(),
  order: z.number().int().optional(),
});

export const taskQuerySchema = z.object({
  status: taskStatusEnum.optional(),
  includeDone: z.coerce.boolean().optional().default(true),
});

// Habit validation schemas
export const habitColorEnum = z.enum(['moss', 'ocean', 'sakura', 'amber', 'twilight']);

export const createHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Name must be less than 80 characters'),
  cadence: z.enum(['daily', 'weekly']).optional().default('daily'),
  targetDays: z.number().int().min(1).max(7).optional().default(1),
  color: habitColorEnum.optional().default('moss'),
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  cadence: z.enum(['daily', 'weekly']).optional(),
  targetDays: z.number().int().min(1).max(7).optional(),
  color: habitColorEnum.optional(),
  order: z.number().int().optional(),
  archived: z.boolean().optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Journal entry schemas
export const createJournalEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(50000, 'Content must be less than 50000 characters'),
  mood: z.enum(['happy', 'calm', 'anxious', 'sad', 'energetic', 'grateful', 'frustrated', 'hopeful', 'neutral']).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional().default([]),
  isPrivate: z.boolean().optional().default(true),
});

export const updateJournalEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  mood: z.enum(['happy', 'calm', 'anxious', 'sad', 'energetic', 'grateful', 'frustrated', 'hopeful', 'neutral']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPrivate: z.boolean().optional(),
});

export const journalQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  mood: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'wordCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createReflectionSchema = z.object({
  journalId: z.string().min(1, 'Journal ID is required'),
  content: z.string().min(1, 'Content is required').max(5000, 'Reflection must be less than 5000 characters'),
  reflectionType: z.enum(['progress', 'insight', 'gratitude', 'lesson']),
});

export const journalStatsSchema = z.object({
  period: z.enum(['week', 'month', 'year', 'all']).optional().default('month'),
});

// Type exports for use in components
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CustomAffirmationInput = z.infer<typeof customAffirmationSchema>;
export type FocusSessionInput = z.infer<typeof focusSessionSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type DateRangeParams = z.infer<typeof dateRangeSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
export type JournalQueryParams = z.infer<typeof journalQuerySchema>;
export type CreateReflectionInput = z.infer<typeof createReflectionSchema>;
export type JournalStatsParams = z.infer<typeof journalStatsSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryParams = z.infer<typeof taskQuerySchema>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type HabitColor = z.infer<typeof habitColorEnum>;
