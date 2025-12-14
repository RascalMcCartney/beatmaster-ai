import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Music2, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function DiscoverWeekly({ onPlayTrack, currentTrack, isPlaying }) {
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
  });

  const { data: listeningHistory = [] } = useQuery({
    queryKey: ['listening-history'],
    queryFn: () => base44.entities.ListeningHistory.list('-played_at', 50),
  });

  const generateRecommendations = async () => {
    setGenerating(true);

    try {
      // Get user's top genres and moods from listening history
      const recentTracks = listeningHistory.slice(0, 20);
      const trackIds = recentTracks.map(h => h.track_id);
      const recentTracksData = tracks.filter(t => trackIds.includes(t.id));

      // Analyze user preferences
      const genreCount = {};
      const moodCount = {};
      const avgEnergy = recentTracksData.reduce((sum, t) => sum + (t.energy || 5), 0) / (recentTracksData.length || 1);
      const avgBPM = recentTracksData.reduce((sum, t) => sum + (t.bpm || 120), 0) / (recentTracksData.length || 1);

      recentTracksData.forEach(track => {
        if (track.sub_genre) {
          genreCount[track.sub_genre] = (genreCount[track.sub_genre] || 0) + 1;
        }
        if (track.mood_tags) {
          track.mood_tags.forEach(mood => {
            moodCount[mood] = (moodCount[mood] || 0) + 1;
          });
        }
      });

      const topGenres = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre);

      const topMoods = Object.entries(moodCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([mood]) => mood);

      // Use AI to generate personalized recommendations
      const aiRecommendations = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a music recommendation AI. Based on the user's listening patterns, generate personalized track recommendations.

User's Listening Profile:
- Top Genres: ${topGenres.join(', ') || 'Various'}
- Preferred Moods: ${topMoods.join(', ') || 'Various'}
- Average Energy Level: ${avgEnergy.toFixed(1)}/10
- Average BPM: ${Math.round(avgBPM)}

Recently Played:
${recentTracksData.slice(0, 10).map(t => `- "${t.title}" by ${t.artist} (${t.sub_genre || t.genre})`).join('\n')}

Available Library (${tracks.length} tracks):
${tracks.slice(0, 50).map(t => `- ID: ${t.id}, "${t.title}" by ${t.artist}, Genre: ${t.sub_genre || t.genre}, BPM: ${t.bpm}, Energy: ${t.energy}, Moods: ${t.mood_tags?.join(', ')}`).join('\n')}

Task: Select 15-20 tracks from the available library that would make excellent personalized recommendations. Consider:
1. Genre diversity while staying within the user's preferences
2. Energy progression (mix of different energy levels)
3. Mood variety that matches user preferences
4. Tracks NOT in the recently played list
5. Mix of familiar genres and discovery opportunities

Return ONLY track IDs from the available library.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_track_ids: {
              type: "array",
              items: { type: "string" }
            },
            reasoning: { type: "string" }
          }
        }
      });

      const recommendedTracks = tracks
        .filter(t => aiRecommendations.recommended_track_ids.includes(t.id))
        .map(track => {
          // Calculate personalization score
          let score = 50;

          // Genre match
          if (topGenres.includes(track.sub_genre)) score += 20;
          if (topGenres.includes(track.genre)) score += 10;

          // Mood match
          if (track.mood_tags) {
            const moodMatches = track.mood_tags.filter(m => topMoods.includes(m)).length;
            score += moodMatches * 8;
          }

          // Energy proximity
          const energyDiff = Math.abs((track.energy || 5) - avgEnergy);
          if (energyDiff <= 2) score += 15;
          else if (energyDiff <= 4) score += 8;

          // BPM proximity
          const bpmDiff = Math.abs((track.bpm || 120) - avgBPM);
          if (bpmDiff <= 10) score += 10;
          else if (bpmDiff <= 20) score += 5;

          return {
            ...track,
            recommendationScore: Math.min(score, 100)
          };
        })
        .sort((a, b) => b.recommendationScore - a.recommendationScore);

      setRecommendations(recommendedTracks);
      toast.success('Generated personalized recommendations');
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  React.useEffect(() => {
    if (tracks.length > 10 && listeningHistory.length > 0 && recommendations.length === 0) {
      generateRecommendations();
    }
  }, [tracks.length, listeningHistory.length]);

  if (tracks.length < 10) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Add more tracks to your library</p>
        <p className="text-xs mt-1">We need at least 10 tracks to generate recommendations</p>
      </div>
    );
  }

  if (listeningHistory.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Start listening to tracks</p>
        <p className="text-xs mt-1">We'll generate personalized recommendations based on your listening history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Discover Weekly
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {recommendations.length > 0 ? `${recommendations.length} personalized picks for you` : 'Personalized recommendations based on your taste'}
          </p>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={generating}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {generating ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Refresh" to generate recommendations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.map((track, index) => (
            <div
              key={track.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
                "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent hover:border-zinc-700",
                currentTrack?.id === track.id && "bg-violet-500/20 border-violet-500/50"
              )}
              onClick={() => onPlayTrack(track)}
            >
              <div className="text-zinc-500 font-mono text-sm w-6 text-center flex-shrink-0">
                {index + 1}
              </div>

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
                <p className="text-xs text-zinc-500 truncate">
                  {track.artist || 'Unknown Artist'}
                  {track.sub_genre && <span className="text-zinc-600"> • {track.sub_genre}</span>}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 text-xs">
                  {track.recommendationScore}% match
                </Badge>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}