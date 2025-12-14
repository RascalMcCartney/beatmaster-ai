import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, ArrowLeft, Grid3X3, List, Music2, Trash2, ArrowUpDown, Users, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlaylistCard from '@/components/playlists/PlaylistCard';
import CreatePlaylistModal from '@/components/playlists/CreatePlaylistModal';
import TrackCard from '@/components/tracks/TrackCard';
import TrackDetailsModal from '@/components/tracks/TrackDetailsModal';
import EditTrackModal from '@/components/tracks/EditTrackModal';
import AudioPlayer from '@/components/player/AudioPlayer';
import AIPlaylistGenerator from '@/components/playlists/AIPlaylistGenerator';
import CollaboratorsModal from '@/components/playlists/CollaboratorsModal';
import ActivityFeed from '@/components/playlists/ActivityFeed';
import ShareModal from '@/components/social/ShareModal';
import { toast } from 'sonner';

export default function Playlists() {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistIdFromUrl = urlParams.get('id');
  
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('created_date');
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlaylist, setEditPlaylist] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [deletePlaylist, setDeletePlaylist] = useState(null);
  const [detailsTrack, setDetailsTrack] = useState(null);
  const [editTrack, setEditTrack] = useState(null);
  const [deleteTrackId, setDeleteTrackId] = useState(null);
  const [aiPlaylistSeed, setAiPlaylistSeed] = useState(null);
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [shareContent, setShareContent] = useState(null);
  const [shareType, setShareType] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: playlists = [], isLoading: playlistsLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => base44.entities.Playlist.list('-created_date'),
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
  });

  // Set selected playlist from URL
  useEffect(() => {
    if (playlistIdFromUrl && playlists.length > 0) {
      const playlist = playlists.find(p => p.id === playlistIdFromUrl);
      if (playlist) {
        setSelectedPlaylist(playlist);
      }
    }
  }, [playlistIdFromUrl, playlists]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Playlist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Playlist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist updated');
      setEditPlaylist(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Playlist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted');
      setDeletePlaylist(null);
      setSelectedPlaylist(null);
    },
  });

  const removeFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }) => {
      const playlist = playlists.find(p => p.id === playlistId);
      const track = tracks.find(t => t.id === trackId);
      const trackIds = (playlist?.track_ids || []).filter(id => id !== trackId);
      await base44.entities.Playlist.update(playlistId, { track_ids: trackIds });
      
      // Log activity
      await base44.entities.PlaylistActivity.create({
        playlist_id: playlistId,
        user_email: currentUser?.email || 'Unknown',
        user_name: currentUser?.full_name || 'Unknown',
        action_type: 'track_removed',
        track_id: trackId,
        track_title: track?.title || 'Unknown',
        track_artist: track?.artist || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-activity'] });
      toast.success('Removed from playlist');
    },
  });

  const handleSavePlaylist = async (data) => {
    if (editPlaylist) {
      await updateMutation.mutateAsync({ id: editPlaylist.id, data });
      
      // Log activity
      await base44.entities.PlaylistActivity.create({
        playlist_id: editPlaylist.id,
        user_email: currentUser?.email || 'Unknown',
        user_name: currentUser?.full_name || 'Unknown',
        action_type: 'playlist_edited',
        details: 'Updated playlist details'
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  // Check user permissions for a playlist
  const getUserPermission = (playlist) => {
    if (!currentUser || !playlist) return null;
    if (playlist.created_by === currentUser.email) return 'owner';
    
    const collaborator = (playlist.collaborators || []).find(c => c.email === currentUser.email);
    return collaborator?.permission || null;
  };

  const canEditPlaylist = (playlist) => {
    const permission = getUserPermission(playlist);
    return permission === 'owner' || permission === 'manage';
  };

  const canAddTracks = (playlist) => {
    const permission = getUserPermission(playlist);
    return permission === 'owner' || permission === 'manage' || permission === 'contribute';
  };

  // Drag and drop handler
  const handleDragEnd = async (result) => {
    if (!result.destination || !selectedPlaylist || selectedPlaylist.is_smart) return;
    
    const items = Array.from(playlistTracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const newTrackIds = items.map(t => t.id);
    
    await updateMutation.mutateAsync({
      id: selectedPlaylist.id,
      data: { track_ids: newTrackIds }
    });
  };

  // Apply smart playlist filters
  const applySmartFilters = (allTracks, criteria) => {
    if (!criteria) return allTracks;
    
    return allTracks.filter(track => {
      // Genre filter
      if (criteria.genres?.length > 0) {
        if (!track.genre || !criteria.genres.includes(track.genre)) return false;
      }
      
      // BPM filter
      if (criteria.bpm_min && track.bpm < criteria.bpm_min) return false;
      if (criteria.bpm_max && track.bpm > criteria.bpm_max) return false;
      
      // Energy filter
      if (criteria.energy_min && track.energy < criteria.energy_min) return false;
      if (criteria.energy_max && track.energy > criteria.energy_max) return false;
      
      // Mood filter
      if (criteria.moods?.length > 0) {
        if (!track.mood_tags?.some(m => criteria.moods.includes(m))) return false;
      }
      
      // Track type filter
      if (criteria.track_types?.length > 0) {
        if (!track.track_type || !criteria.track_types.includes(track.track_type)) return false;
      }
      
      return true;
    }).slice(0, criteria.limit || 50);
  };

  // Get tracks for selected playlist
  const playlistTracks = selectedPlaylist
    ? (() => {
        let filteredTracks;
        
        if (selectedPlaylist.is_smart && selectedPlaylist.smart_criteria) {
          // Smart playlist: auto-filter based on criteria
          filteredTracks = applySmartFilters(tracks, selectedPlaylist.smart_criteria);
        } else {
          // Regular playlist: use track_ids with manual ordering
          const trackMap = new Map(tracks.map(t => [t.id, t]));
          filteredTracks = (selectedPlaylist.track_ids || [])
            .map(id => trackMap.get(id))
            .filter(Boolean);
        }
        
        // Sort if not a smart playlist (smart playlists maintain insertion order)
        if (!selectedPlaylist.is_smart || sortBy !== 'created_date') {
          return filteredTracks.sort((a, b) => {
            switch (sortBy) {
              case 'title':
                return (a.title || '').localeCompare(b.title || '');
              case 'artist':
                return (a.artist || '').localeCompare(b.artist || '');
              case 'bpm':
                return (b.bpm || 0) - (a.bpm || 0);
              case 'energy':
                return (b.energy || 0) - (a.energy || 0);
              case 'danceability':
                return (b.danceability || 0) - (a.danceability || 0);
              case 'created_date':
              default:
                return new Date(b.created_date) - new Date(a.created_date);
            }
          });
        }
        
        return filteredTracks;
      })()
    : [];

  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id) {
      handlePlayPause();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    const trackList = selectedPlaylist ? playlistTracks : tracks;
    const currentIndex = trackList.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex < trackList.length - 1) {
      setCurrentTrack(trackList[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    const trackList = selectedPlaylist ? playlistTracks : tracks;
    const currentIndex = trackList.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      setCurrentTrack(trackList[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  // Playlist Detail View
  if (selectedPlaylist) {
    return (
      <div className="min-h-screen bg-zinc-950 pb-28">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-zinc-400 hover:text-white"
                  onClick={() => {
                    setSelectedPlaylist(null);
                    window.history.pushState({}, '', window.location.pathname);
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">{selectedPlaylist.name}</h1>
                    {selectedPlaylist.is_collaborative && (
                      <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                        <Users className="w-3 h-3 mr-1" />
                        Collaborative
                      </Badge>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm">
                    {playlistTracks.length} track{playlistTracks.length !== 1 ? 's' : ''}
                    {selectedPlaylist.description && ` • ${selectedPlaylist.description}`}
                    {selectedPlaylist.is_collaborative && (
                      <> • {(selectedPlaylist.collaborators || []).length + 1} member{(selectedPlaylist.collaborators || []).length !== 0 ? 's' : ''}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800 text-white">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="created_date">Date Added</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="bpm">BPM</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="danceability">Danceability</SelectItem>
                  </SelectContent>
                </Select>

                <Tabs value={viewMode} onValueChange={setViewMode}>
                  <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="grid" className="data-[state=active]:bg-zinc-800">
                      <Grid3X3 className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list" className="data-[state=active]:bg-zinc-800">
                      <List className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button 
                  variant="outline"
                  className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                  onClick={() => setActivityOpen(true)}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Activity
                </Button>

                <Button 
                  variant="outline"
                  className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                  onClick={() => setCollaboratorsOpen(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Share
                </Button>

                {canEditPlaylist(selectedPlaylist) && (
                  <Button 
                    variant="outline"
                    className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                    onClick={() => {
                      setEditPlaylist(selectedPlaylist);
                      setCreateOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {playlistTracks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6">
                <Music2 className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No tracks yet</h3>
              <p className="text-zinc-400">Add tracks from your library to this playlist</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlistTracks.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  viewMode="grid"
                  isPlaying={isPlaying}
                  isCurrentTrack={currentTrack?.id === track.id}
                  onPlay={() => handlePlayTrack(track)}
                  playlists={playlists}
                  onAddToPlaylist={(playlistId) => 
                    removeFromPlaylistMutation.mutate({ playlistId: selectedPlaylist.id, trackId: track.id })
                  }
                  onShowDetails={() => setDetailsTrack(track)}
                  onEdit={() => setEditTrack(track)}
                  onDelete={() => setDeleteTrackId(track.id)}
                  onShare={() => {
                    setShareContent(track);
                    setShareType('track');
                  }}
                />
              ))}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-1">
                <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
                  <div className="w-12" />
                  <div className="flex-1">Title</div>
                  <div className="hidden md:block w-40">Album</div>
                  <div className="w-16 text-center">BPM</div>
                  <div className="w-20 text-center">Key</div>
                  <div className="hidden lg:block w-20 text-center">Energy</div>
                  <div className="w-14 text-right">Duration</div>
                  <div className="w-8" />
                </div>
                <Droppable droppableId="playlist-tracks" isDropDisabled={selectedPlaylist.is_smart}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {playlistTracks.map((track, index) => (
                        <Draggable
                          key={track.id}
                          draggableId={track.id}
                          index={index}
                          isDragDisabled={selectedPlaylist.is_smart}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TrackCard
                                track={track}
                                viewMode="list"
                                isPlaying={isPlaying}
                                isCurrentTrack={currentTrack?.id === track.id}
                                onPlay={() => handlePlayTrack(track)}
                                playlists={playlists}
                                onAddToPlaylist={(playlistId) => 
                                  removeFromPlaylistMutation.mutate({ playlistId: selectedPlaylist.id, trackId: track.id })
                                }
                                onShowDetails={() => setDetailsTrack(track)}
                                onEdit={() => setEditTrack(track)}
                                onDelete={() => setDeleteTrackId(track.id)}
                                onShare={() => {
                                  setShareContent(track);
                                  setShareType('track');
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </DragDropContext>
          )}
        </main>

        <EditTrackModal
          track={editTrack}
          open={!!editTrack}
          onOpenChange={(open) => !open && setEditTrack(null)}
          onSave={(trackId, data) => updateTrackMutation.mutate({ trackId, data })}
        />

        <TrackDetailsModal
          track={detailsTrack}
          open={!!detailsTrack}
          onOpenChange={(open) => !open && setDetailsTrack(null)}
          onPlayTrack={handlePlayTrack}
          onGeneratePlaylist={(track) => setAiPlaylistSeed(track)}
        />

        <AIPlaylistGenerator
          open={!!aiPlaylistSeed}
          onOpenChange={(open) => !open && setAiPlaylistSeed(null)}
          seedTrack={aiPlaylistSeed}
        />

        <AlertDialog open={!!deleteTrackId} onOpenChange={(open) => !open && setDeleteTrackId(null)}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Track</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Are you sure you want to delete this track? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteTrackMutation.mutate(deleteTrackId);
                  setDeleteTrackId(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <CreatePlaylistModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSave={handleSavePlaylist}
          editPlaylist={editPlaylist}
        />

        <CollaboratorsModal
          playlist={selectedPlaylist}
          open={collaboratorsOpen}
          onOpenChange={setCollaboratorsOpen}
        />

        <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                Activity Feed
              </DialogTitle>
            </DialogHeader>
            <ActivityFeed playlistId={selectedPlaylist?.id} />
          </DialogContent>
        </Dialog>

        <ShareModal
          content={shareContent}
          contentType={shareType}
          open={!!shareContent}
          onOpenChange={(open) => !open && setShareContent(null)}
        />

        <AudioPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          audioRef={audioRef}
        />
      </div>
    );
  }

  // Playlists Grid View
  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Playlists</h1>
              <p className="text-zinc-400 text-sm">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
            </div>

            <Button 
              onClick={() => {
                setEditPlaylist(null);
                setCreateOpen(true);
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Playlist
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {playlistsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-zinc-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6">
              <Music2 className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
            <p className="text-zinc-400 mb-6">Create your first playlist to organize your music</p>
            <Button 
              onClick={() => setCreateOpen(true)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {playlists.map(playlist => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                trackCount={(playlist.track_ids || []).length}
                onClick={() => setSelectedPlaylist(playlist)}
                onEdit={() => {
                  setEditPlaylist(playlist);
                  setCreateOpen(true);
                }}
                onDelete={() => setDeletePlaylist(playlist)}
                onShare={() => {
                  setShareContent(playlist);
                  setShareType('playlist');
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      <CreatePlaylistModal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditPlaylist(null);
        }}
        onSave={handleSavePlaylist}
        editPlaylist={editPlaylist}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePlaylist} onOpenChange={() => setDeletePlaylist(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Playlist</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{deletePlaylist?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate(deletePlaylist.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTrackModal
        track={editTrack}
        open={!!editTrack}
        onOpenChange={(open) => !open && setEditTrack(null)}
        onSave={(trackId, data) => updateTrackMutation.mutate({ trackId, data })}
      />

      <TrackDetailsModal
        track={detailsTrack}
        open={!!detailsTrack}
        onOpenChange={(open) => !open && setDetailsTrack(null)}
        onPlayTrack={handlePlayTrack}
        onGeneratePlaylist={(track) => setAiPlaylistSeed(track)}
      />

      <AIPlaylistGenerator
        open={!!aiPlaylistSeed}
        onOpenChange={(open) => !open && setAiPlaylistSeed(null)}
        seedTrack={aiPlaylistSeed}
      />

      <ShareModal
        content={shareContent}
        contentType={shareType}
        open={!!shareContent}
        onOpenChange={(open) => !open && setShareContent(null)}
      />

      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        audioRef={audioRef}
      />
    </div>
  );
}