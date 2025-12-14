import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Save, Trash2, Play, GripVertical, Sparkles, 
  Loader2, Music2, ArrowRight, Disc
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function PrepSets() {
  const [setName, setSetName] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-updated_date'),
  });

  const { data: savedSets = [] } = useQuery({
    queryKey: ['djsets'],
    queryFn: () => base44.entities.DJSet.list('-created_date'),
  });

  const saveSetMutation = useMutation({
    mutationFn: (setData) => base44.entities.DJSet.create(setData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djsets'] });
      toast.success('Set saved successfully');
      setSetName('');
      setSetDescription('');
      setSelectedTracks([]);
      setAnalysis(null);
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: (id) => base44.entities.DJSet.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djsets'] });
      toast.success('Set deleted');
    },
  });

  const filteredTracks = tracks.filter(track =>
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addTrack = (track) => {
    if (selectedTracks.find(t => t.id === track.id)) {
      toast.error('Track already in set');
      return;
    }
    setSelectedTracks([...selectedTracks, track]);
    setAnalysis(null);
  };

  const removeTrack = (trackId) => {
    setSelectedTracks(selectedTracks.filter(t => t.id !== trackId));
    setAnalysis(null);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(selectedTracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedTracks(items);
    setAnalysis(null);
  };

  const analyzeSet = async () => {
    if (selectedTracks.length < 2) {
      toast.error('Add at least 2 tracks to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      const trackData = selectedTracks.map((t, idx) => ({
        position: idx + 1,
        id: t.id,
        title: t.title,
        artist: t.artist,
        bpm: t.bpm,
        key: t.key,
        camelot: t.camelot,
        energy: t.energy,
        mood: t.mood,
        structure: t.structure,
        duration: t.duration,
      }));

      const prompt = `You are an expert DJ. Analyze this prepared DJ set sequence for mixing quality.

**Track Sequence (${selectedTracks.length} tracks):**
${JSON.stringify(trackData, null, 2)}

**Analysis Required:**
1. **Transition Quality**: For EACH adjacent pair, evaluate:
   - BPM compatibility (ideal: <5 BPM difference)
   - Harmonic compatibility (use Camelot wheel rules)
   - Energy flow (smooth vs jarring)
   - Suggested mixing technique

2. **Overall Flow**: Evaluate the entire set's:
   - Energy arc progression
   - Key journey (harmonic storytelling)
   - Mood coherence
   - Any problematic transitions

3. **Mixing Recommendations**: For each transition, provide:
   - Optimal entry/exit points (in seconds)
   - Specific mixing technique (blend, quick cut, echo out, etc.)
   - EQ adjustments needed
   - Any warnings or challenges

4. **Set Score**: Rate 1-10 for:
   - Harmonic mixing quality
   - BPM flow
   - Energy progression
   - Overall mixability

Provide detailed, actionable feedback for a DJ preparing this set.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            harmonic_score: { type: "number" },
            bpm_score: { type: "number" },
            energy_score: { type: "number" },
            summary: { type: "string" },
            transitions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from_track: { type: "string" },
                  to_track: { type: "string" },
                  quality: { type: "string" },
                  bpm_diff: { type: "number" },
                  harmonic_compatibility: { type: "string" },
                  energy_flow: { type: "string" },
                  mixing_technique: { type: "string" },
                  entry_point: { type: "number" },
                  exit_point: { type: "number" },
                  eq_notes: { type: "string" },
                  warnings: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAnalysis(result);
      toast.success('Set analyzed');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze set');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveSet = async () => {
    if (!setName.trim()) {
      toast.error('Enter a set name');
      return;
    }
    if (selectedTracks.length === 0) {
      toast.error('Add tracks to the set');
      return;
    }

    await saveSetMutation.mutateAsync({
      name: setName,
      description: setDescription,
      tracks: selectedTracks.map((t, idx) => ({
        track_id: t.id,
        track_title: t.title,
        track_artist: t.artist,
        position: idx + 1,
        mixing_notes: analysis?.transitions?.[idx]?.mixing_technique || '',
        transition_type: analysis?.transitions?.[idx]?.mixing_technique || 'blend',
        entry_point: analysis?.transitions?.[idx]?.entry_point || 0,
        exit_point: analysis?.transitions?.[idx]?.exit_point || t.duration || 0,
      })),
      energy_curve: selectedTracks.map(t => t.energy || 5),
      ai_analysis: analysis?.summary || '',
    });
  };

  const loadSet = (set) => {
    setSetName(set.name);
    setSetDescription(set.description || '');
    const loadedTracks = set.tracks
      .sort((a, b) => a.position - b.position)
      .map(st => tracks.find(t => t.id === st.track_id))
      .filter(Boolean);
    setSelectedTracks(loadedTracks);
    setAnalysis(null);
  };

  const getQualityColor = (quality) => {
    const q = quality?.toLowerCase();
    if (q?.includes('excellent') || q?.includes('perfect')) return 'text-green-400';
    if (q?.includes('good')) return 'text-blue-400';
    if (q?.includes('fair') || q?.includes('okay')) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Prepare DJ Sets</h1>
          <p className="text-zinc-400">Plan your set sequence with AI-powered transition analysis</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Track Library */}
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Track Library</h3>
            <Input
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white mb-4"
            />
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredTracks.map(track => (
                <button
                  key={track.id}
                  onClick={() => addTrack(track)}
                  className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                      {track.artwork_url ? (
                        <img src={track.artwork_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Music2 className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate text-sm">{track.title}</h4>
                      <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                      <div className="flex gap-2 mt-1">
                        {track.bpm && (
                          <Badge variant="outline" className="text-xs border-zinc-700 text-violet-400">
                            {track.bpm} BPM
                          </Badge>
                        )}
                        {track.key && (
                          <Badge variant="outline" className="text-xs border-zinc-700 text-fuchsia-400">
                            {track.key}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Middle: Set Builder */}
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Your Set</h3>
              <span className="text-sm text-zinc-500">{selectedTracks.length} tracks</span>
            </div>

            <Input
              placeholder="Set name..."
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white mb-3"
            />
            <Textarea
              placeholder="Description (optional)..."
              value={setDescription}
              onChange={(e) => setSetDescription(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white mb-4 h-20"
            />

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="setTracks">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 mb-4 max-h-[400px] overflow-y-auto"
                  >
                    {selectedTracks.map((track, index) => (
                      <Draggable key={track.id} draggableId={track.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50"
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-zinc-600" />
                            </div>
                            <span className="text-violet-400 font-mono text-sm w-6">{index + 1}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-medium truncate">{track.title}</h4>
                              <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {track.bpm && (
                                <span className="text-xs text-violet-400 font-mono">{track.bpm}</span>
                              )}
                              {track.key && (
                                <span className="text-xs text-fuchsia-400 font-semibold">{track.key}</span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-zinc-500 hover:text-red-400"
                                onClick={() => removeTrack(track.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex gap-2">
              <Button
                onClick={analyzeSet}
                disabled={analyzing || selectedTracks.length < 2}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Set
                  </>
                )}
              </Button>
              <Button
                onClick={saveSet}
                disabled={!setName || selectedTracks.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </Card>

          {/* Right: Analysis & Saved Sets */}
          <div className="space-y-6">
            {/* Analysis Results */}
            {analysis && (
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Set Analysis</h3>
                
                {/* Scores */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-violet-400">{analysis.overall_score}/10</div>
                    <div className="text-xs text-zinc-500">Overall</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-fuchsia-400">{analysis.harmonic_score}/10</div>
                    <div className="text-xs text-zinc-500">Harmonic</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{analysis.bpm_score}/10</div>
                    <div className="text-xs text-zinc-500">BPM Flow</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{analysis.energy_score}/10</div>
                    <div className="text-xs text-zinc-500">Energy</div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-zinc-300 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Transitions */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {analysis.transitions?.map((transition, idx) => (
                    <div key={idx} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-zinc-500">#{idx + 1} → #{idx + 2}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                        <span className={cn("text-sm font-semibold", getQualityColor(transition.quality))}>
                          {transition.quality}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-zinc-400">
                        <div>BPM: {transition.bpm_diff > 0 ? '+' : ''}{transition.bpm_diff}</div>
                        <div>Key: {transition.harmonic_compatibility}</div>
                        <div>Technique: {transition.mixing_technique}</div>
                        {transition.warnings && (
                          <div className="text-amber-400">⚠️ {transition.warnings}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Saved Sets */}
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Saved Sets</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {savedSets.map(set => (
                  <div
                    key={set.id}
                    className="p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{set.name}</h4>
                        <p className="text-xs text-zinc-500">{set.tracks?.length || 0} tracks</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-violet-400 hover:text-violet-300"
                          onClick={() => loadSet(set)}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-300"
                          onClick={() => deleteSetMutation.mutate(set.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}