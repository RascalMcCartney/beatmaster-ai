import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Music2, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";

export default function NextTrackSuggestions({ 
  currentTrack, 
  allTracks, 
  onSelectTrack,
  compact = false 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      generateSuggestions();
    }
  }, [currentTrack?.id]);

  const generateSuggestions = async () => {
    if (!currentTrack || allTracks.length === 0) return;

    setLoading(true);
    try {
      // Filter compatible tracks based on basic rules
      const candidates = allTracks
        .filter(t => t.id !== currentTrack.id)
        .filter(t => {
          if (!t.bpm || !currentTrack.bpm) return true;
          const bpmDiff = Math.abs(t.bpm - currentTrack.bpm);
          return bpmDiff <= 8; // Max 8 BPM difference
        })
        .slice(0, 50); // Limit for AI analysis

      if (candidates.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const prompt = `You are an expert DJ. The currently playing track is:

**Current Track:**
- Title: ${currentTrack.title}
- Artist: ${currentTrack.artist}
- BPM: ${currentTrack.bpm}
- Key: ${currentTrack.key} (Camelot: ${currentTrack.camelot})
- Energy: ${currentTrack.energy}/10
- Mood: ${currentTrack.mood}
- Sub-genre: ${currentTrack.sub_genre}

**Candidate Tracks (${candidates.length} available):**
${JSON.stringify(candidates.slice(0, 30).map(t => ({
  id: t.id,
  title: t.title,
  artist: t.artist,
  bpm: t.bpm,
  key: t.key,
  camelot: t.camelot,
  energy: t.energy,
  mood: t.mood,
  sub_genre: t.sub_genre,
  mixability: t.mixability
})), null, 2)}

**Task:**
Recommend the TOP 5 BEST next tracks based on:
1. Harmonic compatibility (Camelot wheel rules)
2. BPM compatibility (smooth transition)
3. Energy flow (natural progression)
4. Mood coherence
5. Rhythmic compatibility

For each recommended track, provide:
- Why it's a good match
- Compatibility score (1-10)
- Specific mixing advice
- Entry/exit points
- Any warnings or considerations`;

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
                  track_id: { type: "string" },
                  compatibility_score: { type: "number" },
                  reason: { type: "string" },
                  mixing_advice: { type: "string" },
                  harmonic_match: { type: "string" },
                  energy_flow: { type: "string" },
                  bpm_transition: { type: "string" },
                  entry_point: { type: "number" },
                  warnings: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Enrich with full track data
      const enriched = result.recommendations
        .map(rec => {
          const track = candidates.find(t => t.id === rec.track_id);
          return track ? { ...rec, track } : null;
        })
        .filter(Boolean)
        .slice(0, 5);

      setSuggestions(enriched);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentTrack) return null;

  if (compact) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Next Track Suggestions
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSuggestions}
            disabled={loading}
            className="h-7 text-xs"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">No suggestions available</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={suggestion.track.id}
                onClick={() => onSelectTrack(suggestion.track)}
                className="w-full text-left p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                    {suggestion.track.artwork_url ? (
                      <img src={suggestion.track.artwork_url} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <Music2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-violet-400 font-mono text-xs">#{idx + 1}</span>
                      <Badge className="bg-green-500/20 text-green-400 text-xs border-0">
                        {suggestion.compatibility_score}/10
                      </Badge>
                    </div>
                    <h5 className="text-white text-xs font-medium truncate">{suggestion.track.title}</h5>
                    <p className="text-xs text-zinc-500 truncate">{suggestion.track.artist}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-violet-400" />
          AI Next Track Suggestions
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSuggestions}
          disabled={loading}
          className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">Analyzing track compatibility...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Music2 className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400">No suggestions available</p>
          <p className="text-zinc-600 text-sm mt-2">Play a track to get AI recommendations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion, idx) => (
            <div
              key={suggestion.track.id}
              className="p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer group"
              onClick={() => onSelectTrack(suggestion.track)}
            >
              <div className="flex items-start gap-4">
                {/* Rank & Artwork */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    {suggestion.track.artwork_url ? (
                      <img src={suggestion.track.artwork_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Music2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className="text-lg font-bold text-violet-400">#{idx + 1}</span>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{suggestion.track.title}</h4>
                      <p className="text-sm text-zinc-400 truncate">{suggestion.track.artist}</p>
                    </div>
                    <Badge className={cn(
                      "ml-2 text-sm font-bold",
                      suggestion.compatibility_score >= 8 ? "bg-green-500/20 text-green-400" :
                      suggestion.compatibility_score >= 6 ? "bg-blue-500/20 text-blue-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {suggestion.compatibility_score}/10
                    </Badge>
                  </div>

                  {/* Technical Details */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {suggestion.track.bpm && (
                      <Badge variant="outline" className="text-xs border-zinc-700 text-violet-400">
                        {suggestion.track.bpm} BPM • {suggestion.bpm_transition}
                      </Badge>
                    )}
                    {suggestion.track.key && (
                      <Badge variant="outline" className="text-xs border-zinc-700 text-fuchsia-400">
                        {suggestion.track.key} • {suggestion.harmonic_match}
                      </Badge>
                    )}
                    {suggestion.track.energy && (
                      <Badge variant="outline" className="text-xs border-zinc-700 text-amber-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {suggestion.energy_flow}
                      </Badge>
                    )}
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-zinc-400 mb-2">{suggestion.reason}</p>

                  {/* Mixing Advice */}
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-violet-300 font-medium mb-1">Mixing Tip:</p>
                        <p className="text-xs text-zinc-300">{suggestion.mixing_advice}</p>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {suggestion.warnings && (
                    <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                      ⚠️ {suggestion.warnings}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}