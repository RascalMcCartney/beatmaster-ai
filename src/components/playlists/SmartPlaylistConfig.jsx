import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Plus } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

export default function SmartPlaylistConfig({ open, onOpenChange, onSave, initialCriteria }) {
  const [criteria, setCriteria] = useState({
    genres: [],
    bpm_min: 60,
    bpm_max: 180,
    energy_min: 1,
    energy_max: 10,
    moods: [],
    track_types: [],
    limit: 50,
    ...initialCriteria
  });

  const [genreInput, setGenreInput] = useState('');
  const [moodInput, setMoodInput] = useState('');

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
  });

  // Extract unique values from tracks
  const availableGenres = [...new Set(tracks.map(t => t.genre).filter(Boolean))];
  const availableMoods = [...new Set(tracks.flatMap(t => t.mood_tags || []))];
  const availableTypes = ['instrumental', 'vocal', 'mixed'];

  useEffect(() => {
    if (initialCriteria) {
      setCriteria({ ...criteria, ...initialCriteria });
    }
  }, [initialCriteria]);

  const handleAddGenre = () => {
    if (genreInput.trim() && !criteria.genres.includes(genreInput.trim())) {
      setCriteria({ ...criteria, genres: [...criteria.genres, genreInput.trim()] });
      setGenreInput('');
    }
  };

  const handleAddMood = () => {
    if (moodInput.trim() && !criteria.moods.includes(moodInput.trim())) {
      setCriteria({ ...criteria, moods: [...criteria.moods, moodInput.trim()] });
      setMoodInput('');
    }
  };

  const toggleTrackType = (type) => {
    if (criteria.track_types.includes(type)) {
      setCriteria({ ...criteria, track_types: criteria.track_types.filter(t => t !== type) });
    } else {
      setCriteria({ ...criteria, track_types: [...criteria.track_types, type] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Smart Playlist Rules
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Genres */}
            <div>
              <Label className="text-zinc-300 mb-3 block">Genres</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  placeholder="Add genre..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGenre()}
                />
                <Button onClick={handleAddGenre} size="icon" className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {criteria.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {criteria.genres.map((genre) => (
                    <Badge key={genre} className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                      {genre}
                      <button
                        onClick={() => setCriteria({ ...criteria, genres: criteria.genres.filter(g => g !== genre) })}
                        className="ml-2 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {availableGenres.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Quick add:</div>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.slice(0, 10).map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 cursor-pointer hover:bg-zinc-800"
                        onClick={() => {
                          if (!criteria.genres.includes(genre)) {
                            setCriteria({ ...criteria, genres: [...criteria.genres, genre] });
                          }
                        }}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BPM Range */}
            <div>
              <Label className="text-zinc-300 mb-3 block">
                BPM Range: {criteria.bpm_min} - {criteria.bpm_max}
              </Label>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Minimum BPM</div>
                  <Slider
                    value={[criteria.bpm_min]}
                    onValueChange={(v) => setCriteria({ ...criteria, bpm_min: v[0] })}
                    min={60}
                    max={200}
                    step={1}
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Maximum BPM</div>
                  <Slider
                    value={[criteria.bpm_max]}
                    onValueChange={(v) => setCriteria({ ...criteria, bpm_max: v[0] })}
                    min={60}
                    max={200}
                    step={1}
                  />
                </div>
              </div>
            </div>

            {/* Energy Range */}
            <div>
              <Label className="text-zinc-300 mb-3 block">
                Energy Level: {criteria.energy_min} - {criteria.energy_max}
              </Label>
              <Slider
                value={[criteria.energy_min, criteria.energy_max]}
                onValueChange={(v) => setCriteria({ ...criteria, energy_min: v[0], energy_max: v[1] })}
                min={1}
                max={10}
                step={1}
              />
            </div>

            {/* Moods */}
            <div>
              <Label className="text-zinc-300 mb-3 block">Moods</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  placeholder="Add mood..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMood()}
                />
                <Button onClick={handleAddMood} size="icon" className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {criteria.moods.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {criteria.moods.map((mood) => (
                    <Badge key={mood} className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      {mood}
                      <button
                        onClick={() => setCriteria({ ...criteria, moods: criteria.moods.filter(m => m !== mood) })}
                        className="ml-2 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {availableMoods.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Quick add:</div>
                  <div className="flex flex-wrap gap-2">
                    {availableMoods.slice(0, 10).map((mood) => (
                      <Badge
                        key={mood}
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 cursor-pointer hover:bg-zinc-800"
                        onClick={() => {
                          if (!criteria.moods.includes(mood)) {
                            setCriteria({ ...criteria, moods: [...criteria.moods, mood] });
                          }
                        }}
                      >
                        {mood}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Track Types */}
            <div>
              <Label className="text-zinc-300 mb-3 block">Track Types</Label>
              <div className="space-y-2">
                {availableTypes.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      checked={criteria.track_types.includes(type)}
                      onCheckedChange={() => toggleTrackType(type)}
                      className="border-zinc-700"
                    />
                    <span className="text-sm text-zinc-300 capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Limit */}
            <div>
              <Label className="text-zinc-300 mb-3 block">
                Track Limit: {criteria.limit}
              </Label>
              <Slider
                value={[criteria.limit]}
                onValueChange={(v) => setCriteria({ ...criteria, limit: v[0] })}
                min={10}
                max={200}
                step={10}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(criteria);
              onOpenChange(false);
            }}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Save Rules
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}