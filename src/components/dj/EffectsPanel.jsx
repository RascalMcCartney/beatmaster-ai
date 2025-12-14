import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Waves, Filter, Repeat, Volume2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function EffectsPanel({ 
  deckATrack, 
  deckBTrack,
  onEffectChange 
}) {
  const [activeEffect, setActiveEffect] = useState(null);
  const [activeDeck, setActiveDeck] = useState('both');
  const [effectParams, setEffectParams] = useState({
    filter: { cutoff: 50, resonance: 30 },
    echo: { delay: 40, feedback: 50, mix: 30 },
    reverb: { size: 50, mix: 40 },
    flanger: { rate: 50, depth: 50, mix: 40 },
    phaser: { rate: 50, depth: 50, stages: 6 },
    bitcrusher: { bits: 8, rate: 50, mix: 40 }
  });

  const effects = [
    { id: 'filter', name: 'Filter', icon: Filter, color: 'violet' },
    { id: 'echo', name: 'Echo', icon: Repeat, color: 'blue' },
    { id: 'reverb', name: 'Reverb', icon: Waves, color: 'fuchsia' },
    { id: 'flanger', name: 'Flanger', icon: Waves, color: 'cyan' },
    { id: 'phaser', name: 'Phaser', icon: Waves, color: 'purple' },
    { id: 'bitcrusher', name: 'Crush', icon: Volume2, color: 'orange' }
  ];

  // Get AI suggestions based on track analysis
  const getSuggestedEffects = (track) => {
    if (!track) return [];
    const suggestions = [];
    
    if (track.energy >= 8) {
      suggestions.push({ effect: 'filter', reason: 'High energy - Filter sweep works great' });
    }
    if (track.mood_tags?.includes('dark') || track.mood_tags?.includes('aggressive')) {
      suggestions.push({ effect: 'bitcrusher', reason: 'Dark mood - Add grit with crusher' });
    }
    if (track.track_type === 'vocal') {
      suggestions.push({ effect: 'reverb', reason: 'Vocal track - Reverb adds space' });
    }
    if (track.bpm && track.bpm >= 140) {
      suggestions.push({ effect: 'echo', reason: 'Fast BPM - Echo for transitions' });
    }
    
    return suggestions;
  };

  const currentTrack = activeDeck === 'A' ? deckATrack : activeDeck === 'B' ? deckBTrack : null;
  const suggestions = getSuggestedEffects(currentTrack);

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-800 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-bold text-white uppercase">Effects</h3>
        </div>
        <select
          value={activeDeck}
          onChange={(e) => setActiveDeck(e.target.value)}
          className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white"
        >
          <option value="A">Deck A</option>
          <option value="B">Deck B</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 space-y-2">
          <div className="text-xs font-medium text-violet-400 uppercase">AI Suggestions</div>
          {suggestions.slice(0, 2).map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setActiveEffect(suggestion.effect)}
              className="w-full text-left text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <span className="text-violet-400">→</span> {suggestion.reason}
            </button>
          ))}
        </div>
      )}

      {/* Effect Selection */}
      <div className="grid grid-cols-3 gap-2">
        {effects.map(effect => {
          const Icon = effect.icon;
          const isActive = activeEffect === effect.id;
          return (
            <Button
              key={effect.id}
              onClick={() => setActiveEffect(isActive ? null : effect.id)}
              variant="outline"
              className={cn(
                "flex flex-col items-center gap-2 h-auto py-3",
                isActive
                  ? `bg-${effect.color}-600 border-${effect.color}-500 text-white`
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{effect.name}</span>
            </Button>
          );
        })}
      </div>

      {/* Effect Parameters */}
      {activeEffect && (
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          {activeEffect === 'filter' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Cutoff</span>
                  <span className="text-white">{effectParams.filter.cutoff}%</span>
                </div>
                <Slider
                  value={[effectParams.filter.cutoff]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    filter: { ...effectParams.filter, cutoff: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Resonance</span>
                  <span className="text-white">{effectParams.filter.resonance}%</span>
                </div>
                <Slider
                  value={[effectParams.filter.resonance]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    filter: { ...effectParams.filter, resonance: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
            </>
          )}

          {activeEffect === 'echo' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Delay Time</span>
                  <span className="text-white">{effectParams.echo.delay}%</span>
                </div>
                <Slider
                  value={[effectParams.echo.delay]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    echo: { ...effectParams.echo, delay: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Feedback</span>
                  <span className="text-white">{effectParams.echo.feedback}%</span>
                </div>
                <Slider
                  value={[effectParams.echo.feedback]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    echo: { ...effectParams.echo, feedback: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Mix</span>
                  <span className="text-white">{effectParams.echo.mix}%</span>
                </div>
                <Slider
                  value={[effectParams.echo.mix]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    echo: { ...effectParams.echo, mix: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
            </>
          )}

          {activeEffect === 'reverb' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Room Size</span>
                  <span className="text-white">{effectParams.reverb.size}%</span>
                </div>
                <Slider
                  value={[effectParams.reverb.size]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    reverb: { ...effectParams.reverb, size: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Mix</span>
                  <span className="text-white">{effectParams.reverb.mix}%</span>
                </div>
                <Slider
                  value={[effectParams.reverb.mix]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    reverb: { ...effectParams.reverb, mix: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
            </>
          )}

          {activeEffect === 'flanger' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Rate</span>
                  <span className="text-white">{effectParams.flanger.rate}%</span>
                </div>
                <Slider
                  value={[effectParams.flanger.rate]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    flanger: { ...effectParams.flanger, rate: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Depth</span>
                  <span className="text-white">{effectParams.flanger.depth}%</span>
                </div>
                <Slider
                  value={[effectParams.flanger.depth]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    flanger: { ...effectParams.flanger, depth: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
            </>
          )}

          {activeEffect === 'phaser' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Rate</span>
                  <span className="text-white">{effectParams.phaser.rate}%</span>
                </div>
                <Slider
                  value={[effectParams.phaser.rate]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    phaser: { ...effectParams.phaser, rate: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Depth</span>
                  <span className="text-white">{effectParams.phaser.depth}%</span>
                </div>
                <Slider
                  value={[effectParams.phaser.depth]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    phaser: { ...effectParams.phaser, depth: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
            </>
          )}

          {activeEffect === 'bitcrusher' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Bit Depth</span>
                  <span className="text-white">{Math.round(effectParams.bitcrusher.bits)}</span>
                </div>
                <Slider
                  value={[effectParams.bitcrusher.bits]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    bitcrusher: { ...effectParams.bitcrusher, bits: v[0] }
                  })}
                  min={1}
                  max={16}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Sample Rate</span>
                  <span className="text-white">{effectParams.bitcrusher.rate}%</span>
                </div>
                <Slider
                  value={[effectParams.bitcrusher.rate]}
                  onValueChange={(v) => setEffectParams({
                    ...effectParams,
                    bitcrusher: { ...effectParams.bitcrusher, rate: v[0] }
                  })}
                  className="cursor-pointer"
                />
              </div>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            onClick={() => {
              setEffectParams({
                filter: { cutoff: 50, resonance: 30 },
                echo: { delay: 40, feedback: 50, mix: 30 },
                reverb: { size: 50, mix: 40 }
              });
            }}
          >
            Reset
          </Button>
        </div>
      )}

      {/* Quick Presets */}
      <div className="space-y-2 pt-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 uppercase mb-2">Quick FX</div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 text-xs"
          >
            HPF Sweep
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 text-xs"
          >
            LPF Drop
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 text-xs"
          >
            Echo Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 text-xs"
          >
            Build Up
          </Button>
        </div>
      </div>
    </div>
  );
}