import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Grid3X3, List, Search, Filter, ArrowUpDown, Trash2, Edit3, Sparkles, Merge, CheckSquare, Square, Music } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import TrackCard from '@/components/tracks/TrackCard';
import TrackDetailsModal from '@/components/tracks/TrackDetailsModal';
import EditTrackModal from '@/components/tracks/EditTrackModal';
import AudioPlayer from '@/components/player/AudioPlayer';
import AIPlaylistGenerator from '@/components/playlists/AIPlaylistGenerator';
import BulkEditModal from '@/components/library/BulkEditModal';
import DuplicateTracksModal from '@/components/library/DuplicateTracksModal';
import SpotifyIntegration from '@/components/spotify/SpotifyIntegration';
import { toast } from 'sonner';

export default function Library() {
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_date');
  const [filterKey, setFilterKey] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [detailsTrack, setDetailsTrack] = useState(null);
  const [editTrack, setEditTrack] = useState(null);
  const [aiPlaylistSeed, setAiPlaylistSeed] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deleteTrack, setDeleteTrack] = useState(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const audioRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => base44.entities.Playlist.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Track.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success('Track deleted');
      setDeleteTrack(null);
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }) => {
      const playlist = playlists.find(p => p.id === playlistId);
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
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      const selectedIds = Array.from(selectedTracks);
      await Promise.all(
        selectedIds.map(id => base44.entities.Track.update(id, updates))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      setSelectedTracks(new Set());
      setSelectionMode(false);
      toast.success('Tracks updated successfully');
    },
  });

  const mergeDuplicatesMutation = useMutation({
    mutationFn: async ({ primaryId, mergedData, duplicateIds }) => {
      await base44.entities.Track.update(primaryId, mergedData);
      await Promise.all(duplicateIds.map(id => base44.entities.Track.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });

  const importTrackMutation = useMutation({
    mutationFn: async (trackData) => {
      await base44.entities.Track.create({
        ...trackData,
        analysis_status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });

  // Get unique values for filters
  const uniqueKeys = [...new Set(tracks.map(t => t.key).filter(Boolean))].sort();
  const uniqueSubGenres = [...new Set(tracks.map(t => t.sub_genre).filter(Boolean))].sort();
  const trackTypes = ['instrumental', 'vocal', 'mixed'];

  // Filter and sort tracks
  const filteredTracks = tracks
    .filter(track => {
      if (filterKey !== 'all' && track.key !== filterKey) return false;
      if (filterGenre !== 'all' && track.sub_genre !== filterGenre) return false;
      if (filterType !== 'all' && track.track_type !== filterType) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        track.title?.toLowerCase().includes(query) ||
        track.artist?.toLowerCase().includes(query) ||
        track.album?.toLowerCase().includes(query) ||
        track.sub_genre?.toLowerCase().includes(query) ||
        track.genre?.toLowerCase().includes(query) ||
        track.lyrics?.toLowerCase().includes(query) ||
        track.mood?.toLowerCase().includes(query) ||
        track.mood_tags?.some(tag => tag.toLowerCase().includes(query)) ||
        track.instrumentation?.some(inst => inst.toLowerCase().includes(query))
      );
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
        case 'mixability':
          return (b.mixability || 0) - (a.mixability || 0);
        case 'key':
          return (a.key || '').localeCompare(b.key || '');
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
    const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex < filteredTracks.length - 1) {
      setCurrentTrack(filteredTracks[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      setCurrentTrack(filteredTracks[currentIndex - 1]);
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

  const toggleTrackSelection = (trackId) => {
    setSelectedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    const allIds = new Set(filteredTracks.map(t => t.id));
    setSelectedTracks(allIds);
  };

  const clearSelection = () => {
    setSelectedTracks(new Set());
  };

  const handleAutoAnalyze = async () => {
    const selectedIds = Array.from(selectedTracks);
    if (selectedIds.length === 0) {
      toast.error('Please select tracks to analyze');
      return;
    }

    setAnalyzing(true);
    let successCount = 0;

    for (const trackId of selectedIds) {
      const track = tracks.find(t => t.id === trackId);
      if (!track) continue;

      try {
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert music analyst. Analyze this track in detail:

Track: "${track.title}"
Artist: ${track.artist || 'Unknown Artist'}
${track.genre ? `Genre: ${track.genre}` : ''}
${track.bpm ? `BPM: ${track.bpm}` : ''}

Provide comprehensive audio and musical analysis:

1. MOOD & EMOTION: Identify specific moods (e.g., melancholic, euphoric, aggressive, uplifting, dark, dreamy, energetic, chill, nostalgic, anxious). Provide 3-5 mood tags.

2. HARMONIC ANALYSIS: Determine the musical key (e.g., "C Major", "A Minor", "F♯ Minor"). If BPM is provided, verify it's accurate. If not, estimate BPM based on typical genre conventions.

3. GENRE CLASSIFICATION: Identify the primary genre and sub-genre (be specific, e.g., "progressive house", "melodic techno", "deep house", "tech trance").

4. VOCAL ANALYSIS: Assess if the track has vocals. Classify as "instrumental", "vocal", or "mixed". If vocals exist, rate vocal intensity (1-10) and quality.

5. PERFORMANCE METRICS: Rate energy (1-10), emotional intensity (1-10), danceability (1-10), and mixability for DJs (1-10).

6. TRACK CHARACTERISTICS: Assess track type, atmosphere (e.g., spacious, intimate, aggressive, ethereal), and production quality (1-10).

Be precise and analytical in your assessment.`,
          response_json_schema: {
            type: "object",
            properties: {
              mood: { type: "string" },
              mood_tags: { type: "array", items: { type: "string" } },
              key: { type: "string" },
              bpm: { type: "number" },
              genre: { type: "string" },
              sub_genre: { type: "string" },
              track_type: { type: "string", enum: ["instrumental", "vocal", "mixed"] },
              vocal_intensity: { type: "number" },
              energy: { type: "number" },
              emotional_intensity: { type: "number" },
              danceability: { type: "number" },
              mixability: { type: "number" },
              atmosphere: { type: "string" },
              production_quality: { type: "number" }
            }
          }
        });

        await base44.entities.Track.update(trackId, {
          ...analysis,
          analysis_status: 'complete'
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to analyze track ${trackId}:`, error);
      }
    }

    setAnalyzing(false);
    queryClient.invalidateQueries({ queryKey: ['tracks'] });
    setSelectedTracks(new Set());
    setSelectionMode(false);
    toast.success(`Successfully analyzed ${successCount} track${successCount !== 1 ? 's' : ''}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Library</h1>
              <p className="text-zinc-400 text-sm">
                {filteredTracks.length} tracks
                {selectionMode && ` • ${selectedTracks.size} selected`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Selection Mode Actions */}
              {selectionMode && (
                <>
                  <Button
                    onClick={selectAllFiltered}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Select All
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    onClick={() => setBulkEditOpen(true)}
                    disabled={selectedTracks.size === 0}
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Bulk Edit
                  </Button>
                  <Button
                    onClick={handleAutoAnalyze}
                    disabled={selectedTracks.size === 0 || analyzing}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {analyzing ? 'Analyzing...' : 'Auto-Analyze'}
                  </Button>
                  <Button
                    onClick={() => setSelectionMode(false)}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                </>
              )}

              {!selectionMode && (
                <>
                  <Button
                    onClick={() => setSelectionMode(true)}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Select
                  </Button>
                  <Button
                    onClick={() => setDuplicatesOpen(true)}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    <Merge className="w-4 h-4 mr-2" />
                    Find Duplicates
                  </Button>
                  <Button
                    onClick={() => setSpotifyOpen(true)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Spotify
                  </Button>
                </>
              )}
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, lyrics, mood, genre, instruments..."
                  className="pl-10 w-64 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

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
                  <SelectItem value="mixability">Mixability</SelectItem>
                  <SelectItem value="key">Key</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter by Sub-Genre */}
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">All Genres</SelectItem>
                  {uniqueSubGenres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter by Type */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">All Types</SelectItem>
                  {trackTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter by Key */}
              <Select value={filterKey} onValueChange={setFilterKey}>
                <SelectTrigger className="w-32 bg-zinc-900 border-zinc-800 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Key" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">All Keys</SelectItem>
                  {uniqueKeys.map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode */}
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
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-zinc-500 mb-2">No tracks found</div>
            <p className="text-sm text-zinc-600">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredTracks.map(track => (
              <div key={track.id} className="relative">
                {selectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedTracks.has(track.id)}
                      onCheckedChange={() => toggleTrackSelection(track.id)}
                      className="bg-zinc-900/80 border-zinc-700"
                    />
                  </div>
                )}
                <TrackCard
                  track={track}
                  viewMode="grid"
                  isPlaying={isPlaying}
                  isCurrentTrack={currentTrack?.id === track.id}
                  onPlay={() => !selectionMode && handlePlayTrack(track)}
                  playlists={playlists}
                  onAddToPlaylist={(playlistId) => 
                    addToPlaylistMutation.mutate({ playlistId, trackId: track.id })
                  }
                  onShowDetails={() => setDetailsTrack(track)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {selectionMode && (
              <div className="flex items-center gap-4 px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
                <div className="w-8" />
                <div className="w-12" />
                <div className="flex-1">Title</div>
                <div className="hidden md:block w-40">Album</div>
                <div className="w-16 text-center">BPM</div>
                <div className="w-20 text-center">Key</div>
                <div className="hidden lg:block w-20 text-center">Energy</div>
                <div className="w-14 text-right">Duration</div>
                <div className="w-8" />
              </div>
            )}
            {!selectionMode && (
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
            )}
            {filteredTracks.map(track => (
              <div key={track.id} className="flex items-center gap-2">
                {selectionMode && (
                  <Checkbox
                    checked={selectedTracks.has(track.id)}
                    onCheckedChange={() => toggleTrackSelection(track.id)}
                    className="ml-4"
                  />
                )}
                <TrackCard
                  track={track}
                  viewMode="list"
                  isPlaying={isPlaying}
                  isCurrentTrack={currentTrack?.id === track.id}
                  onPlay={() => !selectionMode && handlePlayTrack(track)}
                  playlists={playlists}
                  onAddToPlaylist={(playlistId) => 
                    addToPlaylistMutation.mutate({ playlistId, trackId: track.id })
                  }
                  onShowDetails={() => setDetailsTrack(track)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Track Details Modal */}
      <TrackDetailsModal
        track={detailsTrack}
        open={!!detailsTrack}
        onOpenChange={(open) => !open && setDetailsTrack(null)}
        onPlayTrack={handlePlayTrack}
        onGeneratePlaylist={(track) => setAiPlaylistSeed(track)}
      />

      {/* AI Playlist Generator */}
      <AIPlaylistGenerator
        open={!!aiPlaylistSeed}
        onOpenChange={(open) => !open && setAiPlaylistSeed(null)}
        seedTrack={aiPlaylistSeed}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedTracks={Array.from(selectedTracks).map(id => tracks.find(t => t.id === id))}
        onSave={(updates) => bulkUpdateMutation.mutate(updates)}
      />

      {/* Duplicate Tracks Modal */}
      <DuplicateTracksModal
        open={duplicatesOpen}
        onOpenChange={setDuplicatesOpen}
        tracks={tracks}
        onMerge={(primaryId, mergedData, duplicateIds) => 
          mergeDuplicatesMutation.mutate({ primaryId, mergedData, duplicateIds })
        }
      />

      {/* Spotify Integration */}
      <SpotifyIntegration
        open={spotifyOpen}
        onOpenChange={setSpotifyOpen}
        existingTracks={tracks}
        onImportTrack={(trackData) => importTrackMutation.mutate(trackData)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTrack} onOpenChange={() => setDeleteTrack(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Track</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{deleteTrack?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate(deleteTrack.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audio Player */}
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