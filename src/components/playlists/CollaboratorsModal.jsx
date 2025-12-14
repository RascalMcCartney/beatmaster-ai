import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, UserPlus, Trash2, Crown, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
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

const PERMISSION_LABELS = {
  view: { label: 'View Only', icon: Eye, color: 'zinc' },
  contribute: { label: 'Add Tracks', icon: Edit, color: 'blue' },
  manage: { label: 'Full Access', icon: Crown, color: 'violet' }
};

export default function CollaboratorsModal({ playlist, open, onOpenChange }) {
  const [newEmail, setNewEmail] = useState('');
  const [newPermission, setNewPermission] = useState('contribute');
  const [removeCollaborator, setRemoveCollaborator] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Playlist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Collaborators updated');
    },
  });

  const logActivityMutation = useMutation({
    mutationFn: (activity) => base44.entities.PlaylistActivity.create(activity),
  });

  const handleAddCollaborator = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    // Check if already a collaborator or owner
    if (playlist.created_by === newEmail) {
      toast.error('This user is the playlist owner');
      return;
    }

    const existingCollaborators = playlist.collaborators || [];
    if (existingCollaborators.some(c => c.email === newEmail)) {
      toast.error('This user is already a collaborator');
      return;
    }

    const newCollaborator = {
      email: newEmail,
      permission: newPermission,
      added_at: new Date().toISOString()
    };

    await updatePlaylistMutation.mutateAsync({
      id: playlist.id,
      data: {
        is_collaborative: true,
        collaborators: [...existingCollaborators, newCollaborator]
      }
    });

    await logActivityMutation.mutateAsync({
      playlist_id: playlist.id,
      user_email: currentUser?.email || 'Unknown',
      user_name: currentUser?.full_name || 'Unknown',
      action_type: 'collaborator_added',
      details: `Added ${newEmail} as ${PERMISSION_LABELS[newPermission].label}`
    });

    // Create notification for the new collaborator
    await base44.entities.Notification.create({
      recipient_email: newEmail,
      type: 'collaborator_added',
      actor_email: currentUser?.email,
      actor_name: currentUser?.full_name,
      content_type: 'playlist',
      content_id: playlist.id,
      content_title: playlist.name,
      message: 'added you as a collaborator to',
      action_url: `/Playlists?id=${playlist.id}`
    });

    setNewEmail('');
    setNewPermission('contribute');
  };

  const handleRemoveCollaborator = async (collaboratorEmail) => {
    const existingCollaborators = playlist.collaborators || [];
    const updatedCollaborators = existingCollaborators.filter(c => c.email !== collaboratorEmail);

    await updatePlaylistMutation.mutateAsync({
      id: playlist.id,
      data: {
        collaborators: updatedCollaborators,
        is_collaborative: updatedCollaborators.length > 0
      }
    });

    await logActivityMutation.mutateAsync({
      playlist_id: playlist.id,
      user_email: currentUser?.email || 'Unknown',
      user_name: currentUser?.full_name || 'Unknown',
      action_type: 'collaborator_removed',
      details: `Removed ${collaboratorEmail}`
    });

    setRemoveCollaborator(null);
  };

  const handleUpdatePermission = async (collaboratorEmail, newPerm) => {
    const existingCollaborators = playlist.collaborators || [];
    const updatedCollaborators = existingCollaborators.map(c => 
      c.email === collaboratorEmail ? { ...c, permission: newPerm } : c
    );

    await updatePlaylistMutation.mutateAsync({
      id: playlist.id,
      data: { collaborators: updatedCollaborators }
    });

    toast.success('Permission updated');
  };

  if (!playlist) return null;

  const isOwner = currentUser?.email === playlist.created_by;
  const collaborators = playlist.collaborators || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-400" />
              Manage Collaborators
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Owner */}
            <div>
              <div className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Owner</div>
              <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{playlist.created_by}</div>
                  <div className="text-xs text-zinc-500">Full control</div>
                </div>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  Owner
                </Badge>
              </div>
            </div>

            {/* Add Collaborator */}
            {isOwner && (
              <div>
                <div className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Add Collaborator</div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter email address..."
                      className="bg-zinc-800 border-zinc-700 text-white pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
                    />
                  </div>
                  <Select value={newPermission} onValueChange={setNewPermission}>
                    <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="contribute">Add Tracks</SelectItem>
                      <SelectItem value="manage">Full Access</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddCollaborator}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Collaborators List */}
            {collaborators.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">
                  Collaborators ({collaborators.length})
                </div>
                <div className="space-y-2">
                  {collaborators.map((collaborator, idx) => {
                    const PermIcon = PERMISSION_LABELS[collaborator.permission].icon;
                    return (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                          <PermIcon className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{collaborator.email}</div>
                          <div className="text-xs text-zinc-500">
                            Added {new Date(collaborator.added_at).toLocaleDateString()}
                          </div>
                        </div>
                        {isOwner ? (
                          <div className="flex items-center gap-2">
                            <Select 
                              value={collaborator.permission} 
                              onValueChange={(val) => handleUpdatePermission(collaborator.email, val)}
                            >
                              <SelectTrigger className="w-32 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="view">View Only</SelectItem>
                                <SelectItem value="contribute">Add Tracks</SelectItem>
                                <SelectItem value="manage">Full Access</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => setRemoveCollaborator(collaborator.email)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                            {PERMISSION_LABELS[collaborator.permission].label}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {collaborators.length === 0 && !isOwner && (
              <div className="text-center py-8 text-zinc-500">
                No other collaborators yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Collaborator Confirmation */}
      <AlertDialog open={!!removeCollaborator} onOpenChange={() => setRemoveCollaborator(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to remove {removeCollaborator} from this playlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRemoveCollaborator(removeCollaborator)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}