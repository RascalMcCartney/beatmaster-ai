import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Music2, Sliders, Loader2, ChevronRight, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DJAssistant({ 
  currentTrack, 
  allTracks, 
  currentMood,
  onTrackSelect,
  onApplyEQ,
  onApplyEffect 
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [eqRecommendations, setEqRecommendations] = useState(null);
  const [transitionPoints, setTransitionPoints] = useState(null);

  const getSuggestions = async () => {
    if (!currentTrack) {
      toast.error('No track loaded');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert DJ assistant. Based on the currently playing track, suggest the next 5 tracks to play.

Current Track: "${currentTrack.title}" by ${currentTrack.artist || 'Unknown'}
BPM: ${currentTrack.bpm || 'Unknown'}
Key: ${currentTrack.key || 'Unknown'}
Genre: ${currentTrack.sub_genre || currentTrack.genre || 'Unknown'}
Energy: ${currentTrack.energy || 'Unknown'}/10
Mood: ${currentMood || currentTrack.mood || 'Unknown'}

Available Tracks: ${allTracks.map(t => `"${t.title}" by ${t.artist} (${t.bpm} BPM, ${t.key}, ${t.sub_genre || t.genre})`).join(', ')}

Recommend 5 tracks that would mix well after this track. Consider:
1. Harmonic mixing (compatible keys)
2. BPM compatibility (within 6 BPM or easily pitch-adjustable)
3. Energy progression (smooth energy curve)
4. Genre compatibility
5. Mood flow

For each track, provide a brief mixing tip.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  track_title: { type: "string" },
                  track_artist: { type: "string" },
                  reason: { type: "string" },
                  mixing_tip: { type: "string" },
                  compatibility_score: { type: "number" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      toast.error('Failed to get AI suggestions');
    }
    setLoading(false);
  };

  const getEQRecommendations = async () => {
    if (!currentTrack) {
      toast.error('No track loaded');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `As an expert DJ and audio engineer, analyze this track and provide EQ recommendations:

Track: "${currentTrack.title}" by ${currentTrack.artist || 'Unknown'}
Genre: ${currentTrack.sub_genre || currentTrack.genre || 'Unknown'}
Energy: ${currentTrack.energy || 'Unknown'}/10
Instrumentation: ${currentTrack.instrumentation?.join(', ') || 'Unknown'}
Atmosphere: ${currentTrack.atmosphere || 'Unknown'}
Track Type: ${currentTrack.track_type || 'Unknown'}

Provide specific EQ adjustments (in dB, range -12 to +12) for:
1. Low frequencies (bass, sub-bass)
2. Mid frequencies (vocals, melody)
3. High frequencies (treble, sparkle)

Also suggest one effect that would enhance this track and settings for it.

Consider the track's energy, genre conventions, and mixing context.`,
        response_json_schema: {
          type: "object",
          properties: {
            eq_settings: {
              type: "object",
              properties: {
                low: { type: "number" },
                mid: { type: "number" },
                high: { type: "number" },
                reasoning: { type: "string" }
              }
            },
            effect_suggestion: {
              type: "object",
              properties: {
                effect_type: { type: "string" },
                settings: { type: "string" },
                reasoning: { type: "string" }
              }
            }
          }
        }
      });

      setEqRecommendations(response);
      toast.success('AI recommendations ready');
    } catch (error) {
      console.error('Failed to get EQ recommendations:', error);
      toast.error('Failed to get EQ recommendations');
    }
    setLoading(false);
  };

  const analyzeTransitions = async () => {
    if (!currentTrack) {
      toast.error('No track loaded');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `As an expert DJ, analyze this track's structure and suggest optimal mixing and transition points:

Track: "${currentTrack.title}"
BPM: ${currentTrack.bpm || 'Unknown'}
Structure: ${JSON.stringify(currentTrack.structure || {})}
Energy: ${currentTrack.energy}/10
Mixability: ${currentTrack.mixability}/10

Provide:
1. Best entry point for mixing in (timestamp in seconds)
2. Best exit point for mixing out (timestamp in seconds)
3. Optimal transition techniques for this track
4. Cue points that would be useful
5. Overall mixability assessment

Consider the track's structure, energy progression, and typical DJ mixing practices.`,
        response_json_schema: {
          type: "object",
          properties: {
            entry_point: { type: "number" },
            exit_point: { type: "number" },
            entry_reasoning: { type: "string" },
            exit_reasoning: { type: "string" },
            transition_techniques: {
              type: "array",
              items: { type: "string" }
            },
            recommended_cue_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "number" },
                  label: { type: "string" },
                  purpose: { type: "string" }
                }
              }
            },
            mixability_notes: { type: "string" }
          }
        }
      });

      setTransitionPoints(response);
      toast.success('Transition analysis complete');
    } catch (error) {
      console.error('Failed to analyze transitions:', error);
      toast.error('Failed to analyze transitions');
    }
    setLoading(false);
  };

  const handleApplyEQ = () => {
    if (eqRecommendations?.eq_settings) {
      const { low, mid, high } = eqRecommendations.eq_settings;
      // Convert from dB (-12 to +12) to 0-100 scale with 50 as center
      onApplyEQ({
        low: ((low + 12) / 24) * 100,
        mid: ((mid + 12) / 24) * 100,
        high: ((high + 12) / 24) * 100
      });
      toast.success('EQ settings applied');
    }
  };

  const findTrackByTitle = (title, artist) => {
    return allTracks.find(t => 
      t.title.toLowerCase() === title.toLowerCase() &&
      (!artist || t.artist?.toLowerCase() === artist.toLowerCase())
    );
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-bold text-white">AI DJ Assistant</h3>
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
          <TabsTrigger value="suggestions">Tracks</TabsTrigger>
          <TabsTrigger value="eq">EQ & FX</TabsTrigger>
          <TabsTrigger value="transitions">Transitions</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-3">
          <Button
            onClick={getSuggestions}
            disabled={loading || !currentTrack}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Track Suggestions
              </>
            )}
          </Button>

          <ScrollArea className="h-80">
            <div className="space-y-2">
              {suggestions.map((suggestion, i) => {
                const track = findTrackByTitle(suggestion.track_title, suggestion.track_artist);
                return (
                  <div
                    key={i}
                    className="bg-zinc-800/50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-violet-400">#{i + 1}</span>
                          <h4 className="font-medium text-white text-sm truncate">
                            {suggestion.track_title}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-500">{suggestion.track_artist}</p>
                      </div>
                      {track && (
                        <Button
                          size="sm"
                          onClick={() => onTrackSelect(track)}
                          className="bg-violet-600 hover:bg-violet-700 h-7"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{suggestion.reason}</p>
                    <div className="bg-zinc-900/50 rounded p-2">
                      <p className="text-xs text-emerald-400">
                        💡 {suggestion.mixing_tip}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="eq" className="space-y-3">
          <Button
            onClick={getEQRecommendations}
            disabled={loading || !currentTrack}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4 mr-2" />
                Analyze Track
              </>
            )}
          </Button>

          {eqRecommendations && (
            <ScrollArea className="h-80">
              <div className="space-y-4">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-white mb-3">EQ Recommendations</h4>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Low</span>
                      <span className="text-sm font-mono text-white">
                        {eqRecommendations.eq_settings.low > 0 ? '+' : ''}
                        {eqRecommendations.eq_settings.low.toFixed(1)} dB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Mid</span>
                      <span className="text-sm font-mono text-white">
                        {eqRecommendations.eq_settings.mid > 0 ? '+' : ''}
                        {eqRecommendations.eq_settings.mid.toFixed(1)} dB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">High</span>
                      <span className="text-sm font-mono text-white">
                        {eqRecommendations.eq_settings.high > 0 ? '+' : ''}
                        {eqRecommendations.eq_settings.high.toFixed(1)} dB
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">
                    {eqRecommendations.eq_settings.reasoning}
                  </p>
                  <Button
                    onClick={handleApplyEQ}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Apply EQ Settings
                  </Button>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Effect Suggestion</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-white">
                      {eqRecommendations.effect_suggestion.effect_type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">
                    {eqRecommendations.effect_suggestion.settings}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {eqRecommendations.effect_suggestion.reasoning}
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="transitions" className="space-y-3">
          <Button
            onClick={analyzeTransitions}
            disabled={loading || !currentTrack}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Music2 className="w-4 h-4 mr-2" />
                Analyze Mixability
              </>
            )}
          </Button>

          {transitionPoints && (
            <ScrollArea className="h-80">
              <div className="space-y-4">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Entry/Exit Points</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-emerald-400">Mix In</span>
                        <span className="text-sm font-mono text-white">
                          {Math.floor(transitionPoints.entry_point / 60)}:
                          {(transitionPoints.entry_point % 60).toFixed(0).padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{transitionPoints.entry_reasoning}</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-red-400">Mix Out</span>
                        <span className="text-sm font-mono text-white">
                          {Math.floor(transitionPoints.exit_point / 60)}:
                          {(transitionPoints.exit_point % 60).toFixed(0).padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{transitionPoints.exit_reasoning}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Transition Techniques</h4>
                  <ul className="space-y-1">
                    {transitionPoints.transition_techniques.map((technique, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                        <span className="text-violet-400">•</span>
                        {technique}
                      </li>
                    ))}
                  </ul>
                </div>

                {transitionPoints.recommended_cue_points?.length > 0 && (
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-white mb-3">Recommended Cue Points</h4>
                    <div className="space-y-2">
                      {transitionPoints.recommended_cue_points.map((cue, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs font-mono text-violet-400 mt-0.5">
                            {Math.floor(cue.time / 60)}:{(cue.time % 60).toFixed(0).padStart(2, '0')}
                          </span>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-white">{cue.label}</div>
                            <div className="text-xs text-zinc-500">{cue.purpose}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-white mb-2">Mixability Notes</h4>
                  <p className="text-xs text-zinc-400">{transitionPoints.mixability_notes}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}