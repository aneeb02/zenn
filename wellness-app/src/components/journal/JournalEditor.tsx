'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createJournalEntrySchema, type CreateJournalEntryInput } from '@/lib/validations/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Save, 
  X, 
  Hash, 
  Smile,
  Clock,
  Type,
  Lock,
  Unlock
} from 'lucide-react';

const moods = [
  { value: 'happy', label: '😊 Happy', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'calm', label: '😌 Calm', color: 'bg-blue-100 text-blue-800' },
  { value: 'anxious', label: '😰 Anxious', color: 'bg-orange-100 text-orange-800' },
  { value: 'sad', label: '😢 Sad', color: 'bg-gray-100 text-gray-800' },
  { value: 'energetic', label: '⚡ Energetic', color: 'bg-purple-100 text-purple-800' },
  { value: 'grateful', label: '🙏 Grateful', color: 'bg-green-100 text-green-800' },
  { value: 'frustrated', label: '😤 Frustrated', color: 'bg-red-100 text-red-800' },
  { value: 'hopeful', label: '🌟 Hopeful', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'neutral', label: '😐 Neutral', color: 'bg-gray-100 text-gray-600' },
];

const suggestedTags = [
  'wellness',
  'goals',
  'reflection',
  'gratitude',
  'progress',
  'challenges',
  'achievements',
  'mindfulness',
  'self-care',
  'growth',
];

interface JournalEditorProps {
  onSave: (data: CreateJournalEntryInput) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CreateJournalEntryInput>;
  isEditing?: boolean;
}

export function JournalEditor({ onSave, onCancel, initialData, isEditing = false }: JournalEditorProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateJournalEntryInput>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      mood: initialData?.mood,
      tags: initialData?.tags || [],
      isPrivate: initialData?.isPrivate ?? true,
    },
  });

  const content = watch('content');
  const isPrivate = watch('isPrivate');

  // Calculate word count when content changes
  useState(() => {
    const words = content?.trim().split(/\s+/).filter(word => word.length > 0).length || 0;
    setWordCount(words);
  });

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 10) {
      const newTags = [...tags, tag];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = async (data: CreateJournalEntryInput) => {
    setIsSaving(true);
    try {
      await onSave({ ...data, tags });
      toast.success(isEditing ? 'Journal entry updated!' : 'Journal entry saved!');
    } catch (error) {
      toast.error('Failed to save journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>{isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setValue('isPrivate', !isPrivate)}
            title={isPrivate ? 'Entry is private' : 'Entry is public'}
          >
            {isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Capture your thoughts, reflect on your day, and track your wellness journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              <Type className="inline h-4 w-4 mr-1" />
              Title
            </Label>
            <Input
              id="title"
              placeholder="Give your entry a meaningful title..."
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <Label htmlFor="mood">
              <Smile className="inline h-4 w-4 mr-1" />
              How are you feeling?
            </Label>
            <Select onValueChange={(value) => setValue('mood', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your mood (optional)" />
              </SelectTrigger>
              <SelectContent>
                {moods.map((mood) => (
                  <SelectItem key={mood.value} value={mood.value}>
                    <span className={`px-2 py-1 rounded ${mood.color}`}>
                      {mood.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">
                <BookOpen className="inline h-4 w-4 mr-1" />
                Your Journal Entry
              </Label>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Type className="h-3 w-3" />
                  {wordCount} words
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{Math.max(1, Math.ceil(wordCount / 200))} min read
                </span>
              </div>
            </div>
            <Textarea
              id="content"
              placeholder="Write your thoughts here... What's on your mind? What are you grateful for today? What challenges did you face?"
              {...register('content')}
              className={`min-h-[300px] ${errors.content ? 'border-red-500' : ''}`}
              onChange={(e) => {
                register('content').onChange(e);
                const words = e.target.value.trim().split(/\s+/).filter(word => word.length > 0).length;
                setWordCount(words);
              }}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>
              <Hash className="inline h-4 w-4 mr-1" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-3 py-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTag(tagInput)}
                disabled={tags.length >= 10}
              >
                Add Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestedTags
                .filter(tag => !tags.includes(tag))
                .map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addTag(tag)}
                    className="text-xs"
                  >
                    +{tag}
                  </Button>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : isEditing ? 'Update Entry' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
