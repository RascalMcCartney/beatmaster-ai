import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Play, Trash2, Edit3, Sparkles } from 'lucide-react';
import SetlistCard from '@/components/setlists/SetlistCard';
import CreateSetlistModal from '@/components/setlists/CreateSetlistModal';
import SetlistPlayer from '@/components/setlists/SetlistPlayer';
import AISetlistGenerator from '@/components/ai/AISetlistGenerator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export default function Setlists() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editSetlist, setEditSetlist] = useState(null);
  const [deleteSetlist, setDeleteSetlist] = useState(null);
  const [playingSetlist, setPlayingSetlist] = useState(null);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: setlists = [], isLoading } = useQuery({
    queryKey: ['setlists'],
    queryFn: () => base44.entities.DJSet.list('-created_date'),
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DJSet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      setCreateOpen(false);
      toast.success('Setlist created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DJSet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      setEditSetlist(null);
      toast.success('Setlist updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DJSet.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      setDeleteSetlist(null);
      toast.success('Setlist deleted');
    },
  });

  const filteredSetlists = setlists.filter(setlist => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      setlist.name?.toLowerCase().includes(query) ||
      setlist.description?.toLowerCase().includes(query) ||
      setlist.target_mood?.toLowerCase().includes(query)
    );
  });

  const handleEdit = (setlist) => {
    setEditSetlist(setlist);
    setCreateOpen(true);
  };

  const handleSave = (data) => {
    if (editSetlist) {
      updateMutation.mutate({ id: editSetlist.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (playingSetlist) {
    return (
      <SetlistPlayer
        setlist={playingSetlist}
        tracks={tracks}
        onClose={() => setPlayingSetlist(null)}
        onUpdate={(data) => updateMutation.mutate({ id: playingSetlist.id, data })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">DJ Setlists</h1>
            <p className="text-zinc-400">
              {filteredSetlists.length} setlist{filteredSetlists.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search setlists..."
                className="pl-10 w-64 bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <Button
              onClick={() => setAiGeneratorOpen(true)}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
            <Button
              onClick={() => {
                setEditSetlist(null);
                setCreateOpen(true);
              }}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Setlist
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredSetlists.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-zinc-500 mb-2">No setlists found</div>
            <p className="text-sm text-zinc-600 mb-6">Create your first DJ setlist to get started</p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Setlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSetlists.map(setlist => (
              <SetlistCard
                key={setlist.id}
                setlist={setlist}
                onPlay={() => setPlayingSetlist(setlist)}
                onEdit={() => handleEdit(setlist)}
                onDelete={() => setDeleteSetlist(setlist)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateSetlistModal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditSetlist(null);
        }}
        setlist={editSetlist}
        tracks={tracks}
        onSave={handleSave}
      />

      {/* AI Setlist Generator */}
      <AISetlistGenerator
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        tracks={tracks}
        onGenerate={(data) => createMutation.mutate(data)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSetlist} onOpenChange={() => setDeleteSetlist(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Setlist</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{deleteSetlist?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate(deleteSetlist.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}