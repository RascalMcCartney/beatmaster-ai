import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Save, Download, Music2 } from 'lucide-react';
import { toast } from 'sonner';
import SetConfiguration from '@/components/djset/SetConfiguration';
import SetVisualization from '@/components/djset/SetVisualization';

export default function DJSetGenerator() {
  const [config, setConfig] = useState({
    duration: 60,
    mood: 'progressive',
    energy_arc: 'build',
  });
  const [generatedSet, setGeneratedSet] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  const { data: savedSets = [] } = useQuery({
    queryKey: ['djsets'],
    queryFn: () => base44.entities.DJSet.list('-created_date'),
  });

  const saveSetMutation = useMutation({
    mutationFn: (setData) => base44.entities.DJSet.create(setData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djsets'] });
      toast.success('DJ Set saved successfully');
    },
  });

  const generateSet = async () => {
    if (tracks.length < 5) {
      toast.error('You need at least 5 tracks in your library');
      return;
    }

    setGenerating(true);
    try {
      // Prepare track data for AI analysis
      const trackData = tracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        bpm: t.bpm,
        key: t.key,
        camelot: t.camelot,
        energy: t.energy,
        mood: t.mood,
        mood_tags: t.mood_tags,
        sub_genre: t.sub_genre,
        mixability: t.mixability,
        structure: t.structure,
        mix_notes: t.mix_notes,
        duration: t.duration,
        rhythmic_complexity: t.rhythmic_complexity,
        melodic_complexity: t.melodic_complexity,
        atmosphere: t.atmosphere,
        emotional_intensity: t.emotional_intensity,
      }));

      const prompt = `You are an expert DJ and music curator. Create a professional DJ set from this track library.

**Configuration:**
- Target Duration: ${config.duration} minutes
- Mood/Vibe: ${config.mood}
- Energy Arc: ${config.energy_arc === 'build' ? 'Gradual build-up' : config.energy_arc === 'wave' ? 'Wave pattern (peaks and valleys)' : 'Steady energy'}

**Available Tracks (${tracks.length} total):**
${JSON.stringify(trackData.slice(0, 100), null, 2)}

**Your Task:**
Create a DJ set that:
1. Matches the target duration (select appropriate number of tracks)
2. Follows the energy arc pattern
3. Uses harmonic mixing rules (Camelot wheel - same key, +1/-1, or energy boost)
4. Has smooth BPM transitions (max 5-8 BPM difference between adjacent tracks)
5. Creates a cohesive musical journey that fits the mood
6. Considers track structures for optimal mixing points
7. Provides specific mixing instructions for each transition

For EACH track in the set, provide:
- Track ID, title, artist
- Position in set (1, 2, 3, etc.)
- Why this track is placed here (harmonic/energy reasoning)
- Mixing notes: specific entry/exit points (in seconds) and transition tips
- Transition type: "harmonic_blend", "quick_cut", "echo_out", or "energy_boost"

Also provide:
- Energy curve: array of energy levels (1-10) for each track
- Overall set analysis: describe the journey, key transitions, and why it works
- Set name suggestion based on mood and progression`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            set_name: { type: "string" },
            set_description: { type: "string" },
            tracks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  track_id: { type: "string" },
                  track_title: { type: "string" },
                  track_artist: { type: "string" },
                  position: { type: "number" },
                  reasoning: { type: "string" },
                  mixing_notes: { type: "string" },
                  transition_type: { type: "string" },
                  entry_point: { type: "number" },
                  exit_point: { type: "number" },
                }
              }
            },
            energy_curve: {
              type: "array",
              items: { type: "number" }
            },
            ai_analysis: { type: "string" }
          }
        }
      });

      // Enrich with full track data
      const enrichedTracks = result.tracks.map(t => {
        const fullTrack = tracks.find(track => track.id === t.track_id);
        return {
          ...t,
          fullTrackData: fullTrack
        };
      });

      setGeneratedSet({
        ...result,
        tracks: enrichedTracks,
        config
      });

      toast.success(`Generated ${result.tracks.length}-track DJ set`);
    } catch (error) {
      console.error('Failed to generate set:', error);
      toast.error('Failed to generate DJ set');
    } finally {
      setGenerating(false);
    }
  };

  const saveSet = async () => {
    if (!generatedSet) return;

    setSaving(true);
    try {
      await saveSetMutation.mutateAsync({
        name: generatedSet.set_name,
        description: generatedSet.set_description,
        target_mood: config.mood,
        duration_minutes: config.duration,
        tracks: generatedSet.tracks.map(t => ({
          track_id: t.track_id,
          track_title: t.track_title,
          track_artist: t.track_artist,
          position: t.position,
          mixing_notes: t.mixing_notes,
          transition_type: t.transition_type,
          entry_point: t.entry_point,
          exit_point: t.exit_point,
        })),
        energy_curve: generatedSet.energy_curve,
        ai_analysis: generatedSet.ai_analysis,
      });
    } finally {
      setSaving(false);
    }
  };

  const exportSet = () => {
    if (!generatedSet) return;

    const exportData = {
      name: generatedSet.set_name,
      description: generatedSet.set_description,
      duration_minutes: config.duration,
      mood: config.mood,
      energy_arc: config.energy_arc,
      tracks: generatedSet.tracks.map(t => ({
        position: t.position,
        title: t.track_title,
        artist: t.track_artist,
        bpm: t.fullTrackData?.bpm,
        key: t.fullTrackData?.key,
        energy: t.fullTrackData?.energy,
        mixing_notes: t.mixing_notes,
        transition_type: t.transition_type,
        entry_point: t.entry_point,
        exit_point: t.exit_point,
        reasoning: t.reasoning,
      })),
      energy_curve: generatedSet.energy_curve,
      analysis: generatedSet.ai_analysis,
      generated_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedSet.set_name.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('DJ Set exported');
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI DJ Set Generator</h1>
              <p className="text-zinc-400">Create professional DJ sets with AI-powered track sequencing</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <SetConfiguration
              config={config}
              onChange={setConfig}
              onGenerate={generateSet}
              generating={generating}
              trackCount={tracks.length}
            />

            {/* Saved Sets */}
            {savedSets.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800 p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Saved Sets</h3>
                <div className="space-y-2">
                  {savedSets.slice(0, 5).map(set => (
                    <button
                      key={set.id}
                      onClick={() => {
                        const enrichedTracks = set.tracks.map(t => {
                          const fullTrack = tracks.find(track => track.id === t.track_id);
                          return { ...t, fullTrackData: fullTrack };
                        });
                        setGeneratedSet({
                          set_name: set.name,
                          set_description: set.description,
                          tracks: enrichedTracks,
                          energy_curve: set.energy_curve,
                          ai_analysis: set.ai_analysis,
                        });
                      }}
                      className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <Music2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{set.name}</h4>
                          <p className="text-xs text-zinc-500">
                            {set.tracks?.length || 0} tracks • {set.duration_minutes}min
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Set Visualization */}
          <div className="lg:col-span-2">
            {!generatedSet ? (
              <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Generate Your DJ Set</h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Configure your preferences and let AI create a perfectly sequenced DJ set with harmonic mixing and beatmatched transitions.
                </p>
                {tracks.length < 5 && (
                  <p className="text-sm text-amber-400">
                    You need at least 5 tracks in your library to generate a set
                  </p>
                )}
              </Card>
            ) : (
              <>
                <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">{generatedSet.set_name}</h2>
                      <p className="text-zinc-400">{generatedSet.set_description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={saveSet}
                        disabled={saving}
                        variant="outline"
                        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </Button>
                      <Button
                        onClick={exportSet}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Set Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-violet-400">{generatedSet.tracks.length}</div>
                      <div className="text-xs text-zinc-500">Tracks</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-fuchsia-400">
                        {Math.round(generatedSet.tracks.reduce((acc, t) => acc + (t.fullTrackData?.duration || 0), 0) / 60)}m
                      </div>
                      <div className="text-xs text-zinc-500">Duration</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-400">
                        {(generatedSet.energy_curve?.reduce((a, b) => a + b, 0) / generatedSet.energy_curve?.length).toFixed(1)}
                      </div>
                      <div className="text-xs text-zinc-500">Avg Energy</div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {generatedSet.ai_analysis && (
                    <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-white mb-2">AI Analysis</h4>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                        {generatedSet.ai_analysis}
                      </p>
                    </div>
                  )}
                </Card>

                <SetVisualization set={generatedSet} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}