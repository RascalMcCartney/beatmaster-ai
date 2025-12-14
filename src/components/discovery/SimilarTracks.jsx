import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Music2, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SimilarTracks({ seedTrack, onPlayTrack, currentTrack, isPlaying }) {
  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
  });

  const calculateSimilarity = (track1, track2) => {
    let score = 0;

    // Key match (same key or relative/parallel keys)
    if (track1.key && track2.key) {
      if (track1.key === track2.key) score += 25;
      else if (track1.key.includes(track2.key.split(' ')[0])) score += 15;
    }

    // Camelot match (compatible keys)
    if (track1.camelot && track2.camelot) {
      const camelot1 = track1.camelot;
      const camelot2 = track2.camelot;
      if (camelot1 === camelot2) score += 25;
      else if (Math.abs(parseInt(camelot1) - parseInt(camelot2)) <= 1) score += 15;
    }

    // BPM proximity (within ±5 BPM)
    if (track1.bpm && track2.bpm) {
      const bpmDiff = Math.abs(track1.bpm - track2.bpm);
      if (bpmDiff <= 5) score += 20;
      else if (bpmDiff <= 10) score += 10;
      else if (bpmDiff <= 15) score += 5;
    }

    // Sub-genre exact match
    if (track1.sub_genre && track2.sub_genre && track1.sub_genre === track2.sub_genre) {
      score += 20;
    }

    // Genre match
    if (track1.genre && track2.genre && track1.genre === track2.genre) {
      score += 10;
    }

    // Energy similarity
    if (track1.energy && track2.energy) {
      const energyDiff = Math.abs(track1.energy - track2.energy);
      if (energyDiff <= 2) score += 15;
      else if (energyDiff <= 4) score += 8;
    }

    // Mood overlap
    if (track1.mood_tags && track2.mood_tags) {
      const overlap = track1.mood_tags.filter(mood => 
        track2.mood_tags.includes(mood)
      ).length;
      score += overlap * 8;
    }

    // Track type match
    if (track1.track_type && track2.track_type && track1.track_type === track2.track_type) {
      score += 10;
    }

    // Atmosphere similarity
    if (track1.atmosphere && track2.atmosphere && track1.atmosphere === track2.atmosphere) {
      score += 12;
    }

    // Danceability similarity
    if (track1.danceability && track2.danceability) {
      const danceDiff = Math.abs(track1.danceability - track2.danceability);
      if (danceDiff <= 2) score += 10;
    }

    return score;
  };

  const similarTracks = React.useMemo(() => {
    if (!seedTrack) return [];

    return allTracks
      .filter(t => t.id !== seedTrack.id && t.analysis_status === 'complete')
      .map(track => ({
        ...track,
        similarity: calculateSimilarity(seedTrack, track)
      }))
      .filter(t => t.similarity >= 40)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 12);
  }, [seedTrack, allTracks]);

  if (!seedTrack) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Select a track to find similar tracks</p>
      </div>
    );
  }

  if (similarTracks.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No similar tracks found</p>
        <p className="text-xs mt-1">Try analyzing more tracks in your library</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {similarTracks.map(track => (
        <div
          key={track.id}
          className={cn(
            "group flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
            "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent hover:border-zinc-700",
            currentTrack?.id === track.id && "bg-violet-500/20 border-violet-500/50"
          )}
          onClick={() => onPlayTrack(track)}
        >
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            {track.artwork_url ? (
              <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-zinc-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                {currentTrack?.id === track.id && isPlaying ? (
                  <div className="w-3 h-3 flex gap-0.5">
                    <div className="w-1 bg-black rounded-full animate-pulse" />
                    <div className="w-1 bg-black rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
                    <div className="w-1 bg-black rounded-full animate-pulse" style={{animationDelay: '0.4s'}} />
                  </div>
                ) : (
                  <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
            <p className="text-xs text-zinc-500 truncate">{track.artist || 'Unknown Artist'}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="bg-violet-500/10 border-violet-500/30 text-violet-300 text-xs">
              {track.similarity}% match
            </Badge>
            {track.bpm && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-mono">
                {track.bpm}
              </Badge>
            )}
            {track.camelot && (
              <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                {track.camelot}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}