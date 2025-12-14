import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, TrendingUp, Music2 } from 'lucide-react';
import SimilarTracks from '@/components/discovery/SimilarTracks';
import DiscoverWeekly from '@/components/discovery/DiscoverWeekly';
import AudioPlayer from '@/components/player/AudioPlayer';

export default function Discover() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeedTrack, setSelectedSeedTrack] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  const filteredTracks = tracks.filter(track => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      track.title?.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query) ||
      track.sub_genre?.toLowerCase().includes(query)
    );
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
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex < tracks.length - 1) {
      setCurrentTrack(tracks[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      setCurrentTrack(tracks[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  React.useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-violet-400" />
                Discover
              </h1>
              <p className="text-zinc-400 text-sm">
                Personalized recommendations and similar tracks
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="weekly" className="data-[state=active]:bg-zinc-800">
              <Sparkles className="w-4 h-4 mr-2" />
              Discover Weekly
            </TabsTrigger>
            <TabsTrigger value="similar" className="data-[state=active]:bg-zinc-800">
              <TrendingUp className="w-4 h-4 mr-2" />
              Similar Tracks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6">
            <DiscoverWeekly
              onPlayTrack={handlePlayTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          </TabsContent>

          <TabsContent value="similar" className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Select a Seed Track</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your library..."
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Track Selection */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTracks.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tracks found</p>
                  </div>
                ) : (
                  filteredTracks.slice(0, 50).map(track => (
                    <div
                      key={track.id}
                      onClick={() => setSelectedSeedTrack(track)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedSeedTrack?.id === track.id
                          ? 'bg-violet-500/20 border border-violet-500/50'
                          : 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        {track.artwork_url ? (
                          <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                            <Music2 className="w-4 h-4 text-zinc-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
                        <p className="text-xs text-zinc-500 truncate">{track.artist || 'Unknown Artist'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedSeedTrack && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Similar to "{selectedSeedTrack.title}"
                </h3>
                <SimilarTracks
                  seedTrack={selectedSeedTrack}
                  onPlayTrack={handlePlayTrack}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

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