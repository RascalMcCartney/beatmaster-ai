import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, Grid3X3, List, Search, Sparkles, Zap, Music2, Disc3, Brain, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TrackCard from '@/components/tracks/TrackCard';
import TrackDetailsModal from '@/components/tracks/TrackDetailsModal';
import EditTrackModal from '@/components/tracks/EditTrackModal';
import AudioPlayer from '@/components/player/AudioPlayer';
import UploadModal from '@/components/upload/UploadModal';
import AIPlaylistGenerator from '@/components/playlists/AIPlaylistGenerator';
import DiscoveryAssistant from '@/components/discovery/DiscoveryAssistant';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export default function Home() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_date');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailsTrack, setDetailsTrack] = useState(null);
  const [editTrack, setEditTrack] = useState(null);
  const [deleteTrack, setDeleteTrack] = useState(null);
  const [aiPlaylistSeed, setAiPlaylistSeed] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const audioRef = useRef(null);
  const waveformPlayerRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date')
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => base44.entities.Playlist.list()
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      const trackIds = playlist?.track_ids || [];
      if (!trackIds.includes(trackId)) {
        await base44.entities.Playlist.update(playlistId, {
          track_ids: [...trackIds, trackId]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Added to playlist');
    }
  });

  const updateTrackMutation = useMutation({
    mutationFn: ({ trackId, data }) => base44.entities.Track.update(trackId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success('Track updated');
    }
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (trackId) => base44.entities.Track.delete(trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success('Track deleted');
    }
  });

  const filteredTracks = tracks
    .filter((track) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        (track.title || '').toLowerCase().includes(query) ||
        (track.artist || '').toLowerCase().includes(query) ||
        (track.album || '').toLowerCase().includes(query));
    })
    .sort((a, b) => {
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

  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id) {
      handlePlayPause();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (waveformPlayerRef.current) {
      if (isPlaying) {
        waveformPlayerRef.current.pause();
      } else {
        waveformPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    const currentIndex = filteredTracks.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex < filteredTracks.length - 1) {
      setCurrentTrack(filteredTracks[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    const currentIndex = filteredTracks.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      setCurrentTrack(filteredTracks[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setIsBuffering(true);

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [currentTrack]);

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['tracks'] });
    toast.success('Tracks uploaded and analyzed successfully');
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks..."
                className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500" />

            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800 text-white">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="created_date">Date Added</SelectItem>
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
                onClick={() => setUploadOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white">

                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-600 p-6 md:p-8">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.3),transparent_50%)]" />
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-violet-500/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-fuchsia-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            {/* Floating Icons */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 right-8 text-white/10 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                <Music2 className="w-10 h-10" />
              </div>
              <div className="absolute bottom-6 left-12 text-white/10 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
                <Disc3 className="w-8 h-8" />
              </div>
              <div className="absolute top-12 left-1/3 text-white/10 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.5s' }}>
                <Zap className="w-6 h-6" />
              </div>
            </div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <Brain className="w-3.5 h-3.5 text-violet-200" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">AI-Powered DJ Platform</span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
                Master Your Mix<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-fuchsia-200 to-white">
                  With Legendary Intelligence
                </span>
              </h1>
              
              <p className="text-white/90 text-base md:text-lg mb-6 max-w-xl leading-relaxed">
                Intelligent music analysis, harmonic mixing, and AI-powered setlist generation.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setUploadOpen(true)} className="bg-orange-500 text-amber-50 px-6 py-2 text-sm font-semibold rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 hover:bg-white/90">


                  <Upload className="w-4 h-4 mr-2" />
                  Upload Tracks
                </Button>
                <div className="absolute top-4 right-4 bg-white/10 px-4 py-2 rounded-lg flex items-center gap-4 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-200" />
                    <div className="text-left">
                      <div className="text-xs text-white/60">AI Analysis</div>
                      <div className="text-sm font-bold text-white">{tracks.filter((t) => t.analysis_status === 'complete').length}</div>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Disc3 className="w-4 h-4 text-fuchsia-200" />
                    <div className="text-left">
                      <div className="text-xs text-white/60">Total Tracks</div>
                      <div className="text-sm font-bold text-white">{tracks.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
          { label: 'Total Tracks', value: tracks.length },
          { label: 'Playlists', value: playlists.length },
          { label: 'Analyzed', value: tracks.filter((t) => t.analysis_status === 'complete').length },
          { label: 'Total Duration', value: `${Math.floor(tracks.reduce((acc, t) => acc + (t.duration || 0), 0) / 60)}m` }].
          map((stat) =>
          <div key={stat.label} className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          )}
        </div>

        {/* AI Music Discovery */}
        {tracks.length > 0 &&
        <div className="mb-12">
            <DiscoveryAssistant
            tracks={tracks}
            playlists={playlists}
            onPlayTrack={handlePlayTrack} />

          </div>
        }

        {/* Tracks Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Library</h2>
            <span className="text-sm text-zinc-500">{filteredTracks.length} tracks</span>
          </div>

          {isLoading ?
          <div className="grid gap-4">
              {[1, 2, 3, 4].map((i) =>
            <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />
            )}
            </div> :
          filteredTracks.length === 0 ?
          <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No tracks yet</h3>
              <p className="text-zinc-400 mb-6">Upload your first track to get started</p>
              <Button
              onClick={() => setUploadOpen(true)}
              className="bg-violet-600 hover:bg-violet-700">

                <Upload className="w-4 h-4 mr-2" />
                Upload Tracks
              </Button>
            </div> :
          viewMode === 'grid' ?
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredTracks.map((track) =>
            <TrackCard
              key={track.id}
              track={track}
              viewMode="grid"
              isPlaying={isPlaying}
              isCurrentTrack={currentTrack?.id === track.id}
              onPlay={() => handlePlayTrack(track)}
              playlists={playlists}
              onAddToPlaylist={(playlistId) =>
              addToPlaylistMutation.mutate({ playlistId, trackId: track.id })
              }
              onShowDetails={() => setDetailsTrack(track)}
              onEdit={() => setEditTrack(track)}
              onDelete={() => setDeleteTrack(track)} />

            )}
            </div> :

          <div className="space-y-1">
              {/* List Header */}
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
              {filteredTracks.map((track) =>
            <TrackCard
              key={track.id}
              track={track}
              viewMode="list"
              isPlaying={isPlaying}
              isCurrentTrack={currentTrack?.id === track.id}
              onPlay={() => handlePlayTrack(track)}
              playlists={playlists}
              onAddToPlaylist={(playlistId) =>
              addToPlaylistMutation.mutate({ playlistId, trackId: track.id })
              }
              onShowDetails={() => setDetailsTrack(track)}
              onEdit={() => setEditTrack(track)}
              onDelete={() => setDeleteTrack(track)} />

            )}
            </div>
          }
        </div>
      </main>

      {/* Edit Track Modal */}
      <EditTrackModal
        track={editTrack}
        open={!!editTrack}
        onOpenChange={(open) => !open && setEditTrack(null)}
        onSave={(trackId, data) => updateTrackMutation.mutate({ trackId, data })} />


      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTrack} onOpenChange={(open) => !open && setDeleteTrack(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{deleteTrack?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTrackMutation.mutate(deleteTrack.id);
                setDeleteTrack(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white">

              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete} />


      {/* Track Details Modal */}
      <TrackDetailsModal
        track={detailsTrack}
        open={!!detailsTrack}
        onOpenChange={(open) => !open && setDetailsTrack(null)}
        onPlayTrack={handlePlayTrack}
        onGeneratePlaylist={(track) => setAiPlaylistSeed(track)} />


      {/* AI Playlist Generator */}
      <AIPlaylistGenerator
        open={!!aiPlaylistSeed}
        onOpenChange={(open) => !open && setAiPlaylistSeed(null)}
        seedTrack={aiPlaylistSeed} />

      {/* Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        audioRef={audioRef}
        waveformPlayerRef={waveformPlayerRef} />

    </div>);

}