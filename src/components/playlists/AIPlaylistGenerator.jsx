import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Music2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCompatibilityScore } from '../utils/camelotWheel';

export default function AIPlaylistGenerator({ open, onOpenChange, seedTrack }) {
  const [mode, setMode] = useState(seedTrack ? 'seed' : 'criteria'); // 'seed' or 'criteria'
  const [playlistName, setPlaylistName] = useState('');
  const [trackCount, setTrackCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState([]);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState('');
  
  // Criteria-based inputs
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState('');
  const [energyRange, setEnergyRange] = useState([3, 8]);
  
  const queryClient = useQueryClient();

  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
    enabled: open,
  });

  const createPlaylistMutation = useMutation({
    mutationFn: (data) => base44.entities.Playlist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('AI playlist created successfully!');
      onOpenChange(false);
      resetState();
    },
  });

  const resetState = () => {
    setPlaylistName('');
    setTrackCount(10);
    setGeneratedTracks([]);
    setGeneratedDescription('');
    setGeneratedCoverUrl('');
    setMood('');
    setGenre('');
    setEnergyRange([3, 8]);
  };

  const generatePlaylist = async () => {
    if (allTracks.length < 2) {
      toast.error('Not enough tracks in library');
      return;
    }

    setGenerating(true);

    try {
      let aiStrategy;
      let coverPrompt;
      
      if (mode === 'seed' && seedTrack) {
        // Seed-based generation
        aiStrategy = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert DJ and music curator. Create a cohesive DJ set/playlist strategy.

Seed Track:
- Title: ${seedTrack.title}
- Artist: ${seedTrack.artist || 'Unknown'}
- Genre: ${seedTrack.genre || 'Unknown'}
- Sub-genre: ${seedTrack.sub_genre || 'Unknown'}
- BPM: ${seedTrack.bpm || 'Unknown'}
- Key: ${seedTrack.key || 'Unknown'} (Camelot: ${seedTrack.camelot || 'Unknown'})
- Energy: ${seedTrack.energy || 'Unknown'}/10
- Mood: ${seedTrack.mood || 'Unknown'}

Based on this seed track, provide a strategy for building a ${trackCount}-track DJ playlist that:
1. Flows naturally with smooth transitions
2. Maintains energy progression (can build up, wind down, or maintain)
3. Uses harmonic mixing principles (compatible keys)
4. Keeps BPM variations within mixable ranges
5. Maintains genre/sub-genre coherence

Provide:
- A creative playlist name based on the vibe
- A compelling 2-3 sentence description of the playlist's journey
- Energy progression strategy
- BPM range to target
- Key/Camelot preferences
- Sub-genre focus`,
          response_json_schema: {
            type: "object",
            properties: {
              playlist_name: { type: "string" },
              description: { type: "string" },
              energy_strategy: { type: "string" },
              target_bpm_min: { type: "number" },
              target_bpm_max: { type: "number" },
              prioritize_key_matching: { type: "boolean" },
              allow_energy_variation: { type: "number" }
            }
          }
        });
        
        coverPrompt = `Album cover art for a DJ playlist called "${aiStrategy.playlist_name}". Style: ${seedTrack.sub_genre || seedTrack.genre} music. Mood: ${seedTrack.mood}. Modern, vibrant, abstract design with music energy.`;
        
      } else {
        // Criteria-based generation
        const criteriaText = [
          mood && `Mood: ${mood}`,
          genre && `Genre: ${genre}`,
          `Energy Level: ${energyRange[0]}-${energyRange[1]}/10`
        ].filter(Boolean).join(', ');
        
        aiStrategy = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert DJ and music curator. Create a playlist strategy based on these criteria:

${criteriaText}

Analyze the criteria and provide a strategy for building a ${trackCount}-track playlist that:
1. Matches the specified mood and energy range
2. Maintains the genre preference if specified
3. Creates a cohesive musical journey
4. Uses smooth transitions and compatible tracks

Provide:
- A creative playlist name that captures the essence
- A compelling 2-3 sentence description
- Energy progression strategy
- BPM range recommendations
- Sub-genre preferences
- Key mood descriptors to match`,
          response_json_schema: {
            type: "object",
            properties: {
              playlist_name: { type: "string" },
              description: { type: "string" },
              energy_strategy: { type: "string" },
              target_bpm_min: { type: "number" },
              target_bpm_max: { type: "number" },
              target_moods: { type: "array", items: { type: "string" } },
              target_genres: { type: "array", items: { type: "string" } },
              allow_energy_variation: { type: "number" }
            }
          }
        });
        
        coverPrompt = `Album cover art for a music playlist called "${aiStrategy.playlist_name}". ${mood ? `Mood: ${mood}` : ''}. ${genre ? `Genre: ${genre}` : ''}. Modern, vibrant, abstract design capturing the musical atmosphere.`;
      }

      // Set AI-suggested data
      if (aiStrategy.playlist_name) {
        setPlaylistName(aiStrategy.playlist_name);
      }
      if (aiStrategy.description) {
        setGeneratedDescription(aiStrategy.description);
      }

      // Generate cover art with AI
      try {
        const coverResult = await base44.integrations.Core.GenerateImage({
          prompt: coverPrompt
        });
        setGeneratedCoverUrl(coverResult.url);
      } catch (error) {
        console.error('Failed to generate cover art:', error);
      }

      // Score and select compatible tracks
      const scoredTracks = allTracks
        .filter(t => {
          if (mode === 'seed' && seedTrack) {
            return t.id !== seedTrack.id && t.analysis_status === 'complete';
          }
          return t.analysis_status === 'complete';
        })
        .map(track => {
          let totalScore = 0;
          
          if (mode === 'seed' && seedTrack) {
            // Seed-based scoring
            const compatScore = calculateCompatibilityScore(seedTrack, track);
            totalScore += compatScore;
            
            // BPM range check
            if (track.bpm && aiStrategy.target_bpm_min && aiStrategy.target_bpm_max) {
              if (track.bpm >= aiStrategy.target_bpm_min && track.bpm <= aiStrategy.target_bpm_max) {
                totalScore += 20;
              }
            }
            
            // Energy variation check
            if (track.energy && seedTrack.energy && aiStrategy.allow_energy_variation) {
              const energyDiff = Math.abs(track.energy - seedTrack.energy);
              if (energyDiff <= aiStrategy.allow_energy_variation) {
                totalScore += 15;
              }
            }
            
            // Sub-genre match
            if (track.sub_genre === seedTrack.sub_genre) {
              totalScore += 15;
            }
          } else {
            // Criteria-based scoring
            // Energy range match
            if (track.energy && track.energy >= energyRange[0] && track.energy <= energyRange[1]) {
              totalScore += 30;
            }
            
            // Mood match
            if (mood && track.mood_tags) {
              const moodMatch = track.mood_tags.some(tag => 
                tag.toLowerCase().includes(mood.toLowerCase()) || 
                mood.toLowerCase().includes(tag.toLowerCase())
              );
              if (moodMatch) totalScore += 25;
            }
            
            // Genre match
            if (genre) {
              if (track.sub_genre?.toLowerCase().includes(genre.toLowerCase()) || 
                  track.genre?.toLowerCase().includes(genre.toLowerCase())) {
                totalScore += 25;
              }
            }
            
            // Mood array match from AI
            if (aiStrategy.target_moods && track.mood_tags) {
              const moodMatches = aiStrategy.target_moods.filter(m => 
                track.mood_tags.some(tag => tag.toLowerCase().includes(m.toLowerCase()))
              );
              totalScore += moodMatches.length * 10;
            }
            
            // Genre array match from AI
            if (aiStrategy.target_genres) {
              const genreMatches = aiStrategy.target_genres.filter(g => 
                track.sub_genre?.toLowerCase().includes(g.toLowerCase()) ||
                track.genre?.toLowerCase().includes(g.toLowerCase())
              );
              totalScore += genreMatches.length * 10;
            }
            
            // BPM range check
            if (track.bpm && aiStrategy.target_bpm_min && aiStrategy.target_bpm_max) {
              if (track.bpm >= aiStrategy.target_bpm_min && track.bpm <= aiStrategy.target_bpm_max) {
                totalScore += 15;
              }
            }
          }
          
          return {
            ...track,
            totalScore
          };
        })
        .filter(t => t.totalScore >= (mode === 'seed' ? 40 : 30))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, mode === 'seed' && seedTrack ? trackCount - 1 : trackCount);

      // Build final track list
      const finalTracks = mode === 'seed' && seedTrack ? [seedTrack, ...scoredTracks] : scoredTracks;
      setGeneratedTracks(finalTracks);

    } catch (error) {
      toast.error('Failed to generate playlist');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const createPlaylist = async () => {
    if (!playlistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    if (generatedTracks.length === 0) {
      toast.error('No tracks generated');
      return;
    }

    await createPlaylistMutation.mutateAsync({
      name: playlistName,
      description: generatedDescription || (mode === 'seed' && seedTrack ? `AI-generated DJ set based on "${seedTrack.title}"` : 'AI-generated playlist'),
      track_ids: generatedTracks.map(t => t.id),
      cover_url: generatedCoverUrl || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            AI Playlist Generator
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Mode Selection */}
          {!generatedTracks.length && (
            <div className="flex gap-2">
              {seedTrack && (
                <Button
                  variant={mode === 'seed' ? 'default' : 'outline'}
                  onClick={() => setMode('seed')}
                  className={mode === 'seed' ? 'bg-violet-600' : 'bg-transparent border-zinc-700'}
                >
                  From Seed Track
                </Button>
              )}
              <Button
                variant={mode === 'criteria' ? 'default' : 'outline'}
                onClick={() => setMode('criteria')}
                className={mode === 'criteria' ? 'bg-violet-600' : 'bg-transparent border-zinc-700'}
              >
                From Criteria
              </Button>
            </div>
          )}

          {/* Seed Track */}
          {mode === 'seed' && seedTrack && (
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Seed Track</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {seedTrack.artwork_url ? (
                    <img src={seedTrack.artwork_url} alt={seedTrack.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                      <Music2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{seedTrack.title}</h4>
                  <p className="text-sm text-zinc-400">{seedTrack.artist || 'Unknown Artist'}</p>
                </div>
                <div className="flex gap-2">
                  {seedTrack.bpm && (
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                      {seedTrack.bpm} BPM
                    </Badge>
                  )}
                  {seedTrack.camelot && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      {seedTrack.camelot}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Criteria Inputs */}
          {mode === 'criteria' && !generatedTracks.length && (
            <div className="space-y-4 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
              <div className="space-y-2">
                <Label className="text-zinc-300">Mood (optional)</Label>
                <Input
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="e.g., energetic, chill, dark, uplifting..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Genre (optional)</Label>
                <Input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g., techno, house, trance..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">
                  Energy Level: {energyRange[0]} - {energyRange[1]}
                </Label>
                <Slider
                  value={energyRange}
                  onValueChange={setEnergyRange}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {!generatedTracks.length && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Number of Tracks</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[trackCount]}
                    onValueChange={(v) => setTrackCount(v[0])}
                    min={5}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-8">{trackCount}</span>
                </div>
              </div>

              <Button
                onClick={generatePlaylist}
                disabled={generating}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Playlist
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Tracks */}
          {generatedTracks.length > 0 && (
            <div className="space-y-4">
              {/* Generated Cover Art */}
              {generatedCoverUrl && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img 
                      src={generatedCoverUrl} 
                      alt="Generated cover" 
                      className="w-48 h-48 rounded-xl shadow-2xl object-cover"
                    />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-zinc-300">Playlist Name</Label>
                <Input
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Enter playlist name..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {generatedDescription && (
                <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700">
                  <Label className="text-zinc-400 text-xs mb-2 block">AI Description</Label>
                  <p className="text-sm text-zinc-300 leading-relaxed">{generatedDescription}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-zinc-300">Generated Tracks ({generatedTracks.length})</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGeneratedTracks([])}
                    className="text-zinc-400 hover:text-white"
                  >
                    Regenerate
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generatedTracks.map((track, index) => (
                    <div 
                      key={track.id}
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                    >
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-violet-500/20 text-violet-400 text-sm font-medium">
                        {index + 1}
                      </div>
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
                        <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
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
                        {track.energy && (
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-zinc-400">{track.energy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={createPlaylist}
                disabled={createPlaylistMutation.isPending || !playlistName.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {createPlaylistMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Playlist'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}