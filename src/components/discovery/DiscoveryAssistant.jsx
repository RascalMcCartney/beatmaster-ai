import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Radio, Play, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import RecommendationCard from './RecommendationCard';

export default function DiscoveryAssistant({ tracks, playlists, onPlayTrack, onAddToPlaylist }) {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [seedTrack, setSeedTrack] = useState(null);
  const [genreInput, setGenreInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async (type, params) => {
    setLoading(true);
    try {
      const libraryContext = tracks.slice(0, 20).map(t => ({
        title: t?.title || 'Unknown',
        artist: t?.artist || 'Unknown',
        genre: t?.sub_genre || t?.genre || 'Unknown',
        bpm: t?.bpm || 0,
        key: t?.key || 'Unknown',
        energy: t?.energy || 0,
        mood: t?.mood || 'Unknown',
        mood_tags: t?.mood_tags || [],
        instrumentation: t?.instrumentation || [],
        atmosphere: t?.atmosphere || 'Unknown',
        harmonic_progression: t?.harmonic_progression || 'Unknown',
        rhythmic_complexity: t?.rhythmic_complexity || 0,
        melodic_complexity: t?.melodic_complexity || 0,
        emotional_intensity: t?.emotional_intensity || 0
      }));

      const playlistContext = playlists.slice(0, 5).map(p => ({
        name: p.name,
        track_count: p.track_ids?.length || 0
      }));

      let prompt = '';
      
      if (type === 'library') {
        prompt = `You are an expert music curator, producer, and DJ with deep knowledge of harmonic analysis and production techniques. Analyze this user's music library and generate 8 highly personalized track recommendations.

Library Context (${tracks.length} tracks total):
${JSON.stringify(libraryContext, null, 2)}

Playlists:
${JSON.stringify(playlistContext, null, 2)}

Based on deep analysis of their library, suggest 8 tracks that:
1. Match harmonic preferences (keys, chord progressions, harmonic movement)
2. Align with mood patterns and emotional intensity preferences
3. Match instrumentation and production style preferences
4. Complement their complexity preferences (rhythmic/melodic)
5. Fill atmospheric and sonic gaps in their collection
6. Are DJ-friendly and harmonically compatible with existing tracks

For EACH recommendation, provide:
- Track title (realistic, existing track)
- Artist name
- Genre and specific sub-genre
- BPM (realistic)
- Musical key
- Energy level (1-10)
- Mood tags
- A detailed explanation (3-4 sentences) of WHY this track is recommended, specifically referencing:
  * Harmonic compatibility with their collection
  * How it matches their mood/atmosphere preferences
  * Production style alignment
  * What sonic characteristics they'll appreciate
- Confidence score (1-100) of how well it matches their taste
- What specific tracks/patterns in their library it connects to`;

      } else if (type === 'seed') {
        const seed = params.seedTrack || {};
        prompt = `You are an expert music curator, producer, and harmonic mixing specialist. Generate 8 tracks for a radio station based on this seed track:

Seed Track: ${seed.title || 'Unknown'} by ${seed.artist || 'Unknown'}
Genre: ${seed.sub_genre || seed.genre || 'Unknown'}
BPM: ${seed.bpm || 'Unknown'}
Key: ${seed.key || 'Unknown'}
Camelot: ${seed.camelot || 'Unknown'}
Energy: ${seed.energy || 'Unknown'}
Mood: ${seed.mood || 'Unknown'}
Mood Tags: ${seed.mood_tags?.join(', ') || 'N/A'}
Instrumentation: ${seed.instrumentation?.join(', ') || 'N/A'}
Atmosphere: ${seed.atmosphere || 'N/A'}
Harmonic Progression: ${seed.harmonic_progression || 'N/A'}
Rhythmic Complexity: ${seed.rhythmic_complexity || 'N/A'}
Melodic Complexity: ${seed.melodic_complexity || 'N/A'}
Emotional Intensity: ${seed.emotional_intensity || 'N/A'}

Generate tracks that:
1. Are harmonically compatible (same key, +1 Camelot, or relative minor/major)
2. Match or create intentional energy/emotional progression
3. Share similar instrumentation and sonic palette
4. Have compatible BPMs for seamless DJ mixing
5. Match the atmosphere and production style
6. Provide a cohesive sonic journey

For EACH recommendation, provide a detailed explanation (3-4 sentences) covering:
- Harmonic relationship and mixing compatibility
- Sonic and atmospheric similarities
- How it progresses the musical journey
- Production characteristics that align`;

      } else if (type === 'genre') {
        prompt = `You are an expert music curator. Generate 8 essential tracks for someone interested in ${params.genre}.

Create a diverse selection that:
1. Represents different sub-genres within ${params.genre}
2. Includes classic and contemporary tracks
3. Covers different energy levels and moods
4. Is suitable for both listening and DJ mixing

For EACH recommendation, explain why it's essential for this genre.`;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  artist: { type: "string" },
                  genre: { type: "string" },
                  sub_genre: { type: "string" },
                  bpm: { type: "number" },
                  key: { type: "string" },
                  energy: { type: "number" },
                  mood: { type: "string" },
                  mood_tags: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  atmosphere: { type: "string" },
                  instrumentation: {
                    type: "array",
                    items: { type: "string" }
                  },
                  explanation: { type: "string" },
                  confidence: { type: "number" },
                  connects_to: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(result.recommendations || []);
      toast.success(`Generated ${result.recommendations?.length || 0} recommendations`);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleLibraryAnalysis = () => {
    if (tracks.length === 0) {
      toast.error('Add some tracks to your library first');
      return;
    }
    generateRecommendations('library');
  };

  const handleSeedRadio = () => {
    if (!seedTrack) {
      toast.error('Select a seed track first');
      return;
    }
    generateRecommendations('seed', { seedTrack });
  };

  const handleGenreStation = () => {
    if (!genreInput.trim()) {
      toast.error('Enter a genre or mood');
      return;
    }
    generateRecommendations('genre', { genre: genreInput });
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Music Discovery</h2>
          <p className="text-sm text-zinc-400">Personalized recommendations powered by AI</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="suggestions" className="data-[state=active]:bg-violet-600">
            <Sparkles className="w-4 h-4 mr-2" />
            For You
          </TabsTrigger>
          <TabsTrigger value="radio" className="data-[state=active]:bg-violet-600">
            <Radio className="w-4 h-4 mr-2" />
            Radio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={handleLibraryAnalysis}
              disabled={loading || tracks.length === 0}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Discover New Music
                </>
              )}
            </Button>
          </div>

          {tracks.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Add tracks to your library to get personalized recommendations</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {recommendations.map((rec, idx) => (
                  <RecommendationCard
                    key={idx}
                    recommendation={rec}
                    onPlay={() => toast.info('Track preview not available - this is an AI suggestion')}
                    onInfo={() => toast.info(rec.explanation)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="radio" className="space-y-4">
          <div className="space-y-4">
            {/* Seed Track Radio */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Start radio from a track in your library:</label>
              <div className="flex gap-2">
                <select
                  value={seedTrack?.id || ''}
                  onChange={(e) => setSeedTrack(tracks.find(t => t.id === e.target.value))}
                  className="flex-1 bg-zinc-800 border-zinc-700 text-white rounded-lg px-3 py-2"
                >
                  <option value="">Select a track...</option>
                  {tracks.slice(0, 50).map(track => (
                    <option key={track.id} value={track.id}>
                      {track.title} - {track.artist}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleSeedRadio}
                  disabled={loading || !seedTrack}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Radio className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            {/* Genre/Mood Radio */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Or create a station by genre/mood:</label>
              <div className="flex gap-2">
                <Input
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  placeholder="e.g., deep house, melodic techno, chill vibes..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  onClick={handleGenreStation}
                  disabled={loading || !genreInput.trim()}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>

            {/* Quick Genre Buttons */}
            <div className="flex flex-wrap gap-2">
              {['Deep House', 'Techno', 'Progressive Trance', 'Melodic House', 'Tech House', 'Ambient'].map(genre => (
                <Badge
                  key={genre}
                  className="cursor-pointer bg-zinc-800 hover:bg-violet-600 text-zinc-300 hover:text-white transition-colors"
                  onClick={() => {
                    setGenreInput(genre);
                    setTimeout(() => handleGenreStation(), 100);
                  }}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto mb-3 text-violet-400 animate-spin" />
              <p className="text-zinc-400">Generating personalized radio station...</p>
            </div>
          )}

          {recommendations.length > 0 && !loading && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {recommendations.map((rec, idx) => (
                  <RecommendationCard
                    key={idx}
                    recommendation={rec}
                    onPlay={() => toast.info('Track preview not available - this is an AI suggestion')}
                    onInfo={() => toast.info(rec.explanation)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}