'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { JournalEntryList } from '@/components/journal/JournalEntryList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Link from 'next/link';
import '@/styles/zen-dark.css';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen,
  TrendingUp,
  Calendar,
  Hash,
  Brain,
  Sparkles,
  X,
  ArrowLeft,
  Edit3,
  Trash2
} from 'lucide-react';
import type { CreateJournalEntryInput } from '@/lib/validations/api';

interface JournalEntry {
  id: string;
  title: string;
  content?: string;
  mood?: string | null;
  tags: string[];
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string | null;
  reflections?: any[];
}

interface JournalStats {
  totalEntries: number;
  totalWords: number;
  mostCommonMood: string;
  streakDays: number;
  tagsUsed: string[];
}

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [searchQuery, filterMood, filterTags]);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterMood) params.append('mood', filterMood);
      if (filterTags.length > 0) filterTags.forEach(tag => params.append('tags', tag));

      const response = await fetch(`/api/journal?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }

      const data = await response.json();
      setEntries(data.entries);
    } catch (error) {
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/journal/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch entry');
      }

      const entry = await response.json();
      setSelectedEntry(entry);
    } catch (error) {
      toast.error('Failed to load journal entry');
    }
  };

  const handleCreate = async (data: CreateJournalEntryInput) => {
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create entry');
      }

      await fetchEntries();
      setIsCreating(false);
      toast.success('Journal entry created successfully!');
    } catch (error) {
      toast.error('Failed to create journal entry');
    }
  };

  const handleUpdate = async (data: CreateJournalEntryInput) => {
    if (!selectedEntry) return;

    try {
      const response = await fetch(`/api/journal/${selectedEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update entry');
      }

      await fetchEntries();
      setIsEditing(false);
      setSelectedEntry(null);
      toast.success('Journal entry updated successfully!');
    } catch (error) {
      toast.error('Failed to update journal entry');
    }
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;

    try {
      const response = await fetch(`/api/journal/${entryToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      await fetchEntries();
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      if (selectedEntry?.id === entryToDelete) {
        setSelectedEntry(null);
      }
      toast.success('Journal entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete journal entry');
    }
  };

  const handleView = (id: string) => {
    fetchEntry(id);
  };

  const handleEdit = (id: string) => {
    fetchEntry(id);
    setIsEditing(true);
  };

  const confirmDelete = (id: string) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isCreating || isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <JournalEditor
          onSave={isEditing ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsCreating(false);
            setIsEditing(false);
            setSelectedEntry(null);
          }}
          initialData={isEditing ? selectedEntry || undefined : undefined}
          isEditing={isEditing}
        />
      </div>
    );
  }

  if (selectedEntry && !isEditing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedEntry(null)}>
            ← Back to entries
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
            <Button variant="destructive" onClick={() => confirmDelete(selectedEntry.id)}>
              Delete
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{selectedEntry.title}</CardTitle>
            <CardDescription>
              Created {new Date(selectedEntry.createdAt).toLocaleDateString()} • 
              {selectedEntry.readingTime} min read • 
              {selectedEntry.wordCount} words
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none whitespace-pre-wrap">
              {selectedEntry.content}
            </div>
            
            {selectedEntry.reflections && selectedEntry.reflections.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Reflections
                </h3>
                <div className="space-y-4">
                  {selectedEntry.reflections.map((reflection: any) => (
                    <Card key={reflection.id}>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          {reflection.reflectionType} • 
                          {new Date(reflection.createdAt).toLocaleDateString()}
                        </p>
                        <p>{reflection.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Japanese-inspired header */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-wider text-gray-900 flex items-center gap-3">
                <span className="text-3xl">📓</span>
                <span className="font-japanese">日記</span>
                <span className="text-gray-400 mx-2">·</span>
                <span>Journal</span>
              </h1>
              <p className="text-sm text-gray-500 mt-2 font-light">
                一日一字を記せば三百六十字 · One word a day makes 360 words a year
              </p>
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Write
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">

      <Tabs defaultValue="entries" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="entries">Journal Entries</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <Select value={filterMood || "all"} onValueChange={(value) => setFilterMood(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All moods</SelectItem>
                    <SelectItem value="happy">😊 Happy</SelectItem>
                    <SelectItem value="calm">😌 Calm</SelectItem>
                    <SelectItem value="anxious">😰 Anxious</SelectItem>
                    <SelectItem value="sad">😢 Sad</SelectItem>
                    <SelectItem value="energetic">⚡ Energetic</SelectItem>
                    <SelectItem value="grateful">🙏 Grateful</SelectItem>
                    <SelectItem value="frustrated">😤 Frustrated</SelectItem>
                    <SelectItem value="hopeful">🌟 Hopeful</SelectItem>
                    <SelectItem value="neutral">😐 Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Entry List */}
          <JournalEntryList
            entries={entries}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={confirmDelete}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Writing Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">7 days</p>
                <p className="text-muted-foreground">Keep it up!</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Total Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{entries.length}</p>
                <p className="text-muted-foreground">Journal entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Most Common Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">😊 Happy</p>
                <p className="text-muted-foreground">Your dominant mood</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Journey Timeline</CardTitle>
              <CardDescription>
                Track your progress and see how far you've come
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Timeline visualization coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
