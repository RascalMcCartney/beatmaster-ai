import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, Clock, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AISetlistGenerator({ open, onOpenChange, tracks, onGenerate }) {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [duration, setDuration] = useState(60);
  const [energyProgression, setEnergyProgression] = useState('gradual-build');
  const [generating, setGenerating] = useState(false);

  const genres = [...new Set(tracks.map(t => t.sub_genre || t.genre).filter(Boolean))];
  const moods = ['energetic', 'chill', 'uplifting', 'dark', 'euphoric', 'melancholic', 'dreamy'];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert DJ and music curator. Create an optimal DJ setlist based on these requirements:

Requirements:
- Genre: ${genre || 'Any'}
- Target Mood: ${mood}
- Duration: ${duration} minutes
- Energy Progression: ${energyProgression}

Available Tracks:
${tracks.map(t => `"${t.title}" by ${t.artist} - ${t.bpm} BPM, ${t.key}, ${t.sub_genre || t.genre}, Energy: ${t.energy}/10, Danceability: ${t.danceability}/10`).join('\n')}

Create a setlist that:
1. Flows smoothly with proper harmonic mixing (compatible keys)
2. Has BPM compatibility (gradual changes, no big jumps)
3. Follows the energy progression style: ${energyProgression}
4. Matches the target mood and genre
5. Fills approximately ${duration} minutes (average track ~4 minutes)
6. Has engaging variety while maintaining coherence

For each track, provide:
- Track title and artist
- Position in setlist
- Brief mixing notes
- Why it fits in this position

Also generate an energy curve (array of energy values 1-10 for the progression).`,
        response_json_schema: {
          type: "object",
          properties: {
            setlist_name: { type: "string" },
            description: { type: "string" },
            tracks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  track_title: { type: "string" },
                  track_artist: { type: "string" },
                  position: { type: "number" },
                  mixing_notes: { type: "string" },
                  transition_type: { type: "string" }
                }
              }
            },
            energy_curve: {
              type: "array",
              items: { type: "number" }
            },
            overall_strategy: { type: "string" }
          }
        }
      });

      // Match tracks by title and artist
      const matchedTracks = response.tracks.map(suggestedTrack => {
        const track = tracks.find(t => 
          t.title.toLowerCase() === suggestedTrack.track_title.toLowerCase() &&
          (!suggestedTrack.track_artist || t.artist?.toLowerCase() === suggestedTrack.track_artist.toLowerCase())
        );
        
        return {
          track_id: track?.id,
          track_title: suggestedTrack.track_title,
          track_artist: suggestedTrack.track_artist,
          position: suggestedTrack.position,
          mixing_notes: suggestedTrack.mixing_notes,
          transition_type: suggestedTrack.transition_type || 'blend'
        };
      }).filter(t => t.track_id); // Only include tracks we found

      const setlistData = {
        name: name || response.setlist_name || `${mood} ${genre} Set`,
        description: response.overall_strategy,
        target_mood: mood,
        duration_minutes: duration,
        tracks: matchedTracks,
        energy_curve: response.energy_curve,
        ai_analysis: response.overall_strategy
      };

      onGenerate(setlistData);
      onOpenChange(false);
      toast.success('AI setlist generated!');
      
      // Reset form
      setName('');
      setGenre('');
      setMood('');
      setDuration(60);
      setEnergyProgression('gradual-build');
    } catch (error) {
      console.error('Failed to generate setlist:', error);
      toast.error('Failed to generate setlist');
    }
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            AI Setlist Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Setlist Name (optional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leave empty for AI to name it"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value={null}>Any Genre</SelectItem>
                {genres.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Mood *</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {moods.map(m => (
                  <SelectItem key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration: {duration} minutes
            </Label>
            <Slider
              value={[duration]}
              onValueChange={(v) => setDuration(v[0])}
              min={30}
              max={180}
              step={15}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Energy Progression
            </Label>
            <Select value={energyProgression} onValueChange={setEnergyProgression}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="gradual-build">Gradual Build Up</SelectItem>
                <SelectItem value="peak-early">Peak Early</SelectItem>
                <SelectItem value="peak-middle">Peak in Middle</SelectItem>
                <SelectItem value="peak-late">Peak at End</SelectItem>
                <SelectItem value="roller-coaster">Roller Coaster</SelectItem>
                <SelectItem value="steady">Steady Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-400">
              The AI will analyze your library and create a perfectly mixed setlist 
              with harmonic compatibility, smooth BPM transitions, and the energy 
              progression you specified.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!mood || generating || tracks.length === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Setlist
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}