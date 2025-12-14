import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AutoDJControls({ 
  mixingStyle, 
  onMixingStyleChange,
  transitionType,
  onTransitionTypeChange,
  transitionDuration,
  onTransitionDurationChange
}) {
  const mixingStyles = [
    { 
      id: 'smooth', 
      label: 'Smooth', 
      description: 'Long, gradual transitions',
      color: 'bg-blue-500/20 border-blue-500/50 text-blue-300'
    },
    { 
      id: 'balanced', 
      label: 'Balanced', 
      description: 'Standard club mixing',
      color: 'bg-violet-500/20 border-violet-500/50 text-violet-300'
    },
    { 
      id: 'energetic', 
      label: 'Energetic', 
      description: 'Quick, punchy cuts',
      color: 'bg-red-500/20 border-red-500/50 text-red-300'
    }
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Mixing Settings</h3>
        
        {/* Mixing Style */}
        <div className="space-y-3">
          <Label className="text-zinc-300">Mixing Style</Label>
          <div className="grid grid-cols-3 gap-3">
            {mixingStyles.map(style => (
              <button
                key={style.id}
                onClick={() => onMixingStyleChange(style.id)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left",
                  mixingStyle === style.id
                    ? style.color
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                )}
              >
                <div className="font-semibold mb-1">{style.label}</div>
                <div className="text-xs opacity-75">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Transition Type */}
        <div className="space-y-3 mt-6">
          <Label className="text-zinc-300">Transition Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'auto', label: 'Auto', desc: 'AI decides best type', color: 'bg-violet-500/20 border-violet-500/50 text-violet-300' },
              { id: 'quick_cut', label: 'Quick Cut', desc: 'Sharp, energetic', color: 'bg-red-500/20 border-red-500/50 text-red-300' },
              { id: 'harmonic', label: 'Harmonic', desc: 'Smooth blend', color: 'bg-blue-500/20 border-blue-500/50 text-blue-300' },
              { id: 'echo_out', label: 'Echo Out', desc: 'Reverb fade', color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => onTransitionTypeChange(type.id)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  transitionType === type.id
                    ? type.color
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                )}
              >
                <div className="font-semibold text-sm mb-0.5">{type.label}</div>
                <div className="text-xs opacity-75">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Transition Duration */}
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <Label className="text-zinc-300">Base Transition Duration</Label>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono">
              {transitionDuration}s
            </Badge>
          </div>
          <Slider
            value={[transitionDuration]}
            onValueChange={(v) => onTransitionDurationChange(v[0])}
            min={8}
            max={32}
            step={2}
            className="w-full"
          />
          <p className="text-xs text-zinc-500">
            Actual duration adjusts based on track compatibility
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <h4 className="text-sm font-semibold text-white mb-2">How Auto-DJ Works</h4>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• Beat matching on phrase boundaries (8, 16, 32 bars)</li>
          <li>• Phrase-aligned transitions for seamless mixes</li>
          <li>• Harmonic compatibility analysis (Camelot wheel)</li>
          <li>• Intelligent entry/exit point selection</li>
          <li>• Adaptive crossfade curves per transition type</li>
          <li>• Structure-aware mixing (drops, breakdowns, outros)</li>
        </ul>
      </div>
    </div>
  );
}