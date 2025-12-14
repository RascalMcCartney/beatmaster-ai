import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2 } from 'lucide-react';

export default function SetConfiguration({ config, onChange, onGenerate, generating, trackCount }) {
  const moods = [
    { id: 'progressive', label: 'Progressive', desc: 'Gradual journey' },
    { id: 'peak_time', label: 'Peak Time', desc: 'High energy' },
    { id: 'warm_up', label: 'Warm Up', desc: 'Opening set' },
    { id: 'closing', label: 'Closing', desc: 'Wind down' },
    { id: 'afterhours', label: 'Afterhours', desc: 'Deep & hypnotic' },
  ];

  const energyArcs = [
    { id: 'build', label: 'Build Up', desc: 'Gradual energy increase' },
    { id: 'wave', label: 'Wave', desc: 'Peaks and valleys' },
    { id: 'steady', label: 'Steady', desc: 'Consistent energy' },
    { id: 'plateau', label: 'Plateau', desc: 'Start high, maintain' },
  ];

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Configuration</h3>

      <div className="space-y-6">
        {/* Duration */}
        <div>
          <Label className="text-zinc-300 mb-3 block">
            Duration: <span className="text-violet-400 font-semibold">{config.duration} minutes</span>
          </Label>
          <Slider
            value={[config.duration]}
            onValueChange={(v) => onChange({ ...config, duration: v[0] })}
            min={30}
            max={180}
            step={15}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>30min</span>
            <span>180min</span>
          </div>
        </div>

        {/* Mood */}
        <div>
          <Label className="text-zinc-300 mb-3 block">Set Mood/Style</Label>
          <div className="space-y-2">
            {moods.map(mood => (
              <button
                key={mood.id}
                onClick={() => onChange({ ...config, mood: mood.id })}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  config.mood === mood.id
                    ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <div className="font-semibold text-sm">{mood.label}</div>
                <div className="text-xs opacity-75">{mood.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Arc */}
        <div>
          <Label className="text-zinc-300 mb-3 block">Energy Arc</Label>
          <div className="space-y-2">
            {energyArcs.map(arc => (
              <button
                key={arc.id}
                onClick={() => onChange({ ...config, energy_arc: arc.id })}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  config.energy_arc === arc.id
                    ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <div className="font-semibold text-sm">{arc.label}</div>
                <div className="text-xs opacity-75">{arc.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={generating || trackCount < 5}
          className="w-full bg-violet-600 hover:bg-violet-700 h-12"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate DJ Set
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}