import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Loader2, Music2, ExternalLink, Play, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SpotifyIntegration({ open, onOpenChange, onImportTrack, existingTracks = [] }) {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [playingPreview, setPlayingPreview] = useState(null);
  const audioRef = React.useRef(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data } = await base44.functions.invoke('spotify', {
        action: 'search',
        query: searchQuery,
        limit: 20
      });

      setSearchResults(data.results || []);
    } catch (error) {
      toast.error('Failed to search Spotify');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (existingTracks.length === 0) {
      toast.error('Add some tracks to your library first');
      return;
    }

    setLoadingRecs(true);
    try {
      // Get up to 5 random tracks with spotify IDs to use as seeds
      const tracksWithSpotifyIds = existingTracks.filter(t => t.spotify_id);
      
      if (tracksWithSpotifyIds.length === 0) {
        toast.error('No tracks with Spotify IDs found in your library');
        return;
      }

      const shuffled = [...tracksWithSpotifyIds].sort(() => 0.5 - Math.random());
      const seeds = shuffled.slice(0, Math.min(5, shuffled.length)).map(t => t.spotify_id);

      const { data } = await base44.functions.invoke('spotify', {
        action: 'recommendations',
        seedTracks: seeds,
        limit: 20
      });

      setRecommendations(data.results || []);
      setActiveTab('recommendations');
    } catch (error) {
      toast.error('Failed to get recommendations');
      console.error(error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleImport = async (track) => {
    try {
      // Get full track details including audio features
      const { data } = await base44.functions.invoke('spotify', {
        action: 'trackDetails',
        trackId: track.spotify_id
      });

      onImportTrack(data.track);
      toast.success(`Imported "${track.title}"`);
    } catch (error) {
      toast.error('Failed to import track');
      console.error(error);
    }
  };

  const playPreview = (url, trackId) => {
    if (!url) {
      toast.error('No preview available for this track');
      return;
    }

    if (playingPreview === trackId) {
      audioRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingPreview(trackId);
      }
    }
  };

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = () => setPlayingPreview(null);
    }
  }, []);

  const TrackRow = ({ track, source }) => (
    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        {track.artwork_url ? (
          <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-zinc-500" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
        <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
        {track.album && (
          <p className="text-xs text-zinc-600 truncate">{track.album}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {track.bpm && (
          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-mono">
            {track.bpm}
          </Badge>
        )}
        {track.energy && (
          <Badge variant="outline" className="border-amber-700 text-amber-400 text-xs">
            E{track.energy}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {track.preview_url && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={() => playPreview(track.preview_url, track.id)}
          >
            <Play className={`w-4 h-4 ${playingPreview === track.id ? 'fill-white' : ''}`} />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-zinc-400 hover:text-white"
          onClick={() => window.open(track.external_url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          className="h-8 w-8 bg-violet-600 hover:bg-violet-700"
          onClick={() => handleImport(track)}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <audio ref={audioRef} />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Spotify Integration
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-zinc-800 border border-zinc-700 w-full">
              <TabsTrigger value="search" className="flex-1 data-[state=active]:bg-zinc-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex-1 data-[state=active]:bg-zinc-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="flex-1 flex flex-col min-h-0 mt-4">
              <div className="flex gap-2 mb-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for tracks, artists, albums..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {searchResults.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Search for tracks on Spotify</p>
                  </div>
                ) : (
                  searchResults.map(track => (
                    <TrackRow key={track.id} track={track} source="search" />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="flex-1 flex flex-col min-h-0 mt-4">
              <div className="mb-4">
                <Button
                  onClick={handleGetRecommendations}
                  disabled={loadingRecs}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {loadingRecs ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Recommendations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Recommendations Based on Your Library
                    </>
                  )}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {recommendations.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Click the button above to get personalized recommendations</p>
                    <p className="text-xs mt-1">Based on tracks in your library</p>
                  </div>
                ) : (
                  recommendations.map(track => (
                    <TrackRow key={track.id} track={track} source="recommendations" />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}