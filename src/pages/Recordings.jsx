import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Download, Trash2, Mic2, Clock, Calendar, Music2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Recordings() {
  const [currentRecording, setCurrentRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deleteRecording, setDeleteRecording] = useState(null);
  const [editRecording, setEditRecording] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const audioRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => base44.entities.Recording.list('-created_date'),
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: (id) => base44.entities.Recording.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast.success('Recording deleted');
    },
  });

  const updateRecordingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Recording.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast.success('Recording updated');
      setEditRecording(null);
    },
  });

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayRecording = (recording) => {
    if (currentRecording?.id === recording.id) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setCurrentRecording(recording);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 100);
    }
  };

  const handleDownload = (recording) => {
    const link = document.createElement('a');
    link.href = recording.audio_url;
    link.download = `${recording.title}.webm`;
    link.click();
  };

  const handleEdit = (recording) => {
    setEditRecording(recording);
    setEditTitle(recording.title);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }
    updateRecordingMutation.mutate({
      id: editRecording.id,
      data: { title: editTitle }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <audio ref={audioRef} src={currentRecording?.audio_url} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Mic2 className="w-8 h-8 text-violet-400" />
            DJ Set Recordings
          </h1>
          <p className="text-zinc-400">Your recorded mixes and performances</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Recordings', value: recordings.length },
            { label: 'Total Duration', value: `${Math.floor(recordings.reduce((acc, r) => acc + (r.duration || 0), 0) / 60)}m` },
            { label: 'This Month', value: recordings.filter(r => new Date(r.created_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length },
            { label: 'Tracks Recorded', value: recordings.reduce((acc, r) => acc + (r.tracks_played?.length || 0), 0) },
          ].map(stat => (
            <div key={stat.label} className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recordings List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6">
              <Mic2 className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No recordings yet</h3>
            <p className="text-zinc-400 mb-6">Start recording your DJ sets in DJ Mode</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recordings.map(recording => (
              <Card key={recording.id} className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4 p-6">
                  {/* Play Button */}
                  <Button
                    onClick={() => handlePlayRecording(recording)}
                    size="icon"
                    className="h-14 w-14 rounded-full bg-violet-600 hover:bg-violet-700"
                  >
                    {currentRecording?.id === recording.id && isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </Button>

                  {/* Recording Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1">{recording.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(recording.recording_date || recording.created_date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(recording.duration)}
                      </div>
                      {recording.tracks_played?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Music2 className="w-4 h-4" />
                          {recording.tracks_played.length} tracks
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(recording)}
                      size="icon"
                      variant="ghost"
                      className="text-zinc-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDownload(recording)}
                      size="icon"
                      variant="ghost"
                      className="text-zinc-400 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setDeleteRecording(recording)}
                      size="icon"
                      variant="ghost"
                      className="text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Track Timeline */}
                {recording.tracks_played?.length > 0 && (
                  <div className="border-t border-zinc-800 px-6 py-4 bg-zinc-800/30">
                    <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Track Timeline</div>
                    <ScrollArea className="max-h-32">
                      <div className="space-y-1">
                        {recording.tracks_played.map((track, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono text-xs">
                              {formatDuration(track.timestamp)}
                            </Badge>
                            <span className="text-zinc-300">{track.track_title}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editRecording} onOpenChange={(open) => !open && setEditRecording(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Recording</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditRecording(null)}
                className="bg-zinc-800 border-zinc-700 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-violet-600 hover:bg-violet-700"
                disabled={updateRecordingMutation.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecording} onOpenChange={(open) => !open && setDeleteRecording(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{deleteRecording?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteRecordingMutation.mutate(deleteRecording.id);
                setDeleteRecording(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}