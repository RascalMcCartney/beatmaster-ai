import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, Headphones, Sliders, Settings2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import EffectsPanel from './EffectsPanel';

export default function Mixer({
  crossfader,
  onCrossfaderChange,
  crossfaderCurve,
  onCrossfaderCurveChange,
  deckAVolume,
  deckBVolume,
  masterVolume,
  onDeckAVolumeChange,
  onDeckBVolumeChange,
  onMasterVolumeChange,
  deckAEQ,
  deckBEQ,
  masterEQ,
  onDeckAEQChange,
  onDeckBEQChange,
  onMasterEQChange,
  headphoneCueA,
  headphoneCueB,
  onHeadphoneCueAChange,
  onHeadphoneCueBChange,
  headphoneVolume,
  onHeadphoneVolumeChange,
  deckATrack,
  deckBTrack
}) {
  const [showEffects, setShowEffects] = useState(false);

  return (
    <div className="h-64 bg-zinc-900 border-t-2 border-zinc-800 flex flex-shrink-0">
      {/* Effects Panel (Toggleable) */}
      {showEffects && (
        <EffectsPanel
          deckATrack={deckATrack}
          deckBTrack={deckBTrack}
        />
      )}

      <div className="flex-1 px-6 py-4">
        <div className="h-full flex items-center gap-8">
          {/* Deck A Controls */}
          <div className="flex-1 space-y-4">
            <div className="text-center">
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Deck A</span>
            </div>
            
            {/* EQ */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 text-center font-bold">HIGH</div>
                <div className="h-24 flex items-center justify-center">
                  <Slider
                    orientation="vertical"
                    value={[deckAEQ.high]}
                    onValueChange={(v) => onDeckAEQChange({ ...deckAEQ, high: v[0] })}
                    className="h-full cursor-pointer"
                  />
                </div>
                <div className="text-xs text-center text-blue-400 font-mono">
                  {deckAEQ.high > 50 ? '+' : ''}{((deckAEQ.high - 50) / 5).toFixed(1)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 text-center font-bold">MID</div>
                <div className="h-24 flex items-center justify-center">
                  <Slider
                    orientation="vertical"
                    value={[deckAEQ.mid]}
                    onValueChange={(v) => onDeckAEQChange({ ...deckAEQ, mid: v[0] })}
                    className="h-full cursor-pointer"
                  />
                </div>
                <div className="text-xs text-center text-blue-400 font-mono">
                  {deckAEQ.mid > 50 ? '+' : ''}{((deckAEQ.mid - 50) / 5).toFixed(1)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 text-center font-bold">LOW</div>
                <div className="h-24 flex items-center justify-center">
                  <Slider
                    orientation="vertical"
                    value={[deckAEQ.low]}
                    onValueChange={(v) => onDeckAEQChange({ ...deckAEQ, low: v[0] })}
                    className="h-full cursor-pointer"
                  />
                </div>
                <div className="text-xs text-center text-blue-400 font-mono">
                  {deckAEQ.low > 50 ? '+' : ''}{((deckAEQ.low - 50) / 5).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Volume Fader with Level Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-zinc-500 font-mono">{deckAVolume}%</span>
              </div>
              <div className="relative">
                <Slider
                  value={[deckAVolume]}
                  onValueChange={(v) => onDeckAVolumeChange(v[0])}
                  className="cursor-pointer"
                />
                {/* Volume Level Indicator */}
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-150"
                    style={{ width: `${deckAVolume}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center Section */}
          <div className="w-80 space-y-6">
            {/* Crossfader with Visual Feedback */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400 font-bold">A</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 uppercase">Crossfader</span>
                  <Select value={crossfaderCurve} onValueChange={onCrossfaderCurveChange}>
                    <SelectTrigger className="h-6 w-20 bg-zinc-800 border-zinc-700 text-xs">
                      <Settings2 className="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="smooth">Smooth</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="sharp">Sharp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-xs text-fuchsia-400 font-bold">B</span>
              </div>
              <div className="relative">
                {/* Visual Crossfader Bars */}
                <div className="absolute inset-x-0 -top-3 flex gap-1 h-2">
                  <div 
                    className="bg-blue-500/50 rounded-full transition-all duration-150"
                    style={{ width: `${100 - crossfader}%` }}
                  />
                  <div 
                    className="bg-fuchsia-500/50 rounded-full transition-all duration-150"
                    style={{ width: `${crossfader}%` }}
                  />
                </div>
                <Slider
                  value={[crossfader]}
                  onValueChange={(v) => onCrossfaderChange(v[0])}
                  className="cursor-pointer"
                />
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-2xl font-bold text-white">
                  {crossfader < 45 ? 'A' : crossfader > 55 ? 'B' : '='}
                </div>
              </div>
            </div>

            {/* Master Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 uppercase font-bold">Master</span>
                <span className="text-xs text-zinc-500">{masterVolume}%</span>
              </div>
              <Slider
                value={[masterVolume]}
                onValueChange={(v) => onMasterVolumeChange(v[0])}
                className="cursor-pointer"
              />
            </div>

            {/* Headphone Cue */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onHeadphoneCueAChange(!headphoneCueA)}
                  className={cn(
                    "flex-1",
                    headphoneCueA
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  <Headphones className="w-4 h-4 mr-2" />
                  Cue A
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onHeadphoneCueBChange(!headphoneCueB)}
                  className={cn(
                    "flex-1",
                    headphoneCueB
                      ? "bg-fuchsia-600 border-fuchsia-500 text-white"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  <Headphones className="w-4 h-4 mr-2" />
                  Cue B
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-zinc-500" />
                <Slider
                  value={[headphoneVolume]}
                  onValueChange={(v) => onHeadphoneVolumeChange(v[0])}
                  className="flex-1 cursor-pointer"
                />
                <span className="text-xs text-zinc-500 w-10 text-right">{headphoneVolume}%</span>
              </div>
            </div>

            {/* Effects Toggle */}
            <Button
              onClick={() => setShowEffects(!showEffects)}
              variant="outline"
              className={cn(
                "w-full",
                showEffects 
                  ? "bg-violet-600 border-violet-500 text-white" 
                  : "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              )}
            >
              <Sliders className="w-4 h-4 mr-2" />
              Effects
            </Button>
          </div>

          {/* Deck B Controls */}
          <div className="flex-1 space-y-4">
            <div className="text-center">
              <span className="text-xs text-fuchsia-400 font-bold uppercase tracking-wider">Deck B</span>
            </div>
            
            {/* EQ */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 text-center font-bold">HIGH</div>
                <div className="h-24 flex items-center justify-center">
                  <Slider
                    orientation="vertical"
                    value={[deckBEQ.high]}
                    onValueChange={(v) => onDeckBEQChange({ ...deckBEQ, high: v[0] })}
                    className="h-full cursor-pointer"
                  />
                </div>
                <div className="text-xs text-center text-fuchsia-400 font-mono">
                  {deckBEQ.high > 50 ? '+' : ''}{((deckBEQ.high - 50) / 5).toFixed(1)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 text-center font-bold">MID</div>
                <div className="h-24 flex items-center justify-center">
                  <Slider
                    orientation="vertical"
                    value={[deckBEQ.mid]}
                    onValueChange={(v) => onDeckBEQChange({ ...deckBEQ, mid: v[0] })}
                    className="h-full cursor-pointer"
                  />
                </div>
                <div className="text-xs text-center text-fuchsia-400 font-mono">
                  {deckBEQ.mid > 50 ? '+' : ''}{((deckBEQ.mid - 50) / 5).toFixed(1)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 text-center font-bold">LOW</div>
                <div className="h-24 flex items-center justify-center">
                  <Slider
                    orientation="vertical"
                    value={[deckBEQ.low]}
                    onValueChange={(v) => onDeckBEQChange({ ...deckBEQ, low: v[0] })}
                    className="h-full cursor-pointer"
                  />
                </div>
                <div className="text-xs text-center text-fuchsia-400 font-mono">
                  {deckBEQ.low > 50 ? '+' : ''}{((deckBEQ.low - 50) / 5).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Volume Fader with Level Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Volume2 className="w-4 h-4 text-fuchsia-400" />
                <span className="text-xs text-zinc-500 font-mono">{deckBVolume}%</span>
              </div>
              <div className="relative">
                <Slider
                  value={[deckBVolume]}
                  onValueChange={(v) => onDeckBVolumeChange(v[0])}
                  className="cursor-pointer"
                />
                {/* Volume Level Indicator */}
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 transition-all duration-150"
                    style={{ width: `${deckBVolume}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}