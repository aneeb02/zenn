'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Clock, 
  Hash, 
  Smile,
  Calendar,
  Eye,
  Edit,
  Trash2,
  ChevronRight
} from 'lucide-react';

const moodConfig: Record<string, { label: string; color: string; emoji: string }> = {
  happy: { label: 'Happy', color: 'bg-yellow-100 text-yellow-800', emoji: '😊' },
  calm: { label: 'Calm', color: 'bg-blue-100 text-blue-800', emoji: '😌' },
  anxious: { label: 'Anxious', color: 'bg-orange-100 text-orange-800', emoji: '😰' },
  sad: { label: 'Sad', color: 'bg-gray-100 text-gray-800', emoji: '😢' },
  energetic: { label: 'Energetic', color: 'bg-purple-100 text-purple-800', emoji: '⚡' },
  grateful: { label: 'Grateful', color: 'bg-green-100 text-green-800', emoji: '🙏' },
  frustrated: { label: 'Frustrated', color: 'bg-red-100 text-red-800', emoji: '😤' },
  hopeful: { label: 'Hopeful', color: 'bg-indigo-100 text-indigo-800', emoji: '🌟' },
  neutral: { label: 'Neutral', color: 'bg-gray-100 text-gray-600', emoji: '😐' },
};

interface JournalEntry {
  id: string;
  title: string;
  mood?: string | null;
  tags: string[];
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string | null;
}

interface JournalEntryListProps {
  entries: JournalEntry[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function JournalEntryList({ 
  entries, 
  onView, 
  onEdit, 
  onDelete,
  isLoading = false 
}: JournalEntryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
          <p className="text-gray-500">
            Start your wellness journey by creating your first journal entry.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const mood = entry.mood ? moodConfig[entry.mood] : null;
        
        return (
          <Card 
            key={entry.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onView(entry.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{entry.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.readingTime} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {entry.wordCount} words
                    </span>
                    {entry.lastViewedAt && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Last viewed {formatDistanceToNow(new Date(entry.lastViewedAt), { addSuffix: true })}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(entry.id)}
                    title="Edit entry"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(entry.id)}
                    title="Delete entry"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {mood && (
                    <Badge variant="secondary" className={mood.color}>
                      <Smile className="h-3 w-3 mr-1" />
                      {mood.emoji} {mood.label}
                    </Badge>
                  )}
                  {entry.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-gray-500" />
                      <div className="flex gap-1">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
