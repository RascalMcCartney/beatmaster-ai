import React, { useEffect, useRef, useState } from 'react';
import { cn } from "@/lib/utils";
import { Activity } from 'lucide-react';

export default function BeatmatchingVisualization({ 
  deckATrack, 
  deckBTrack,
  deckAPlaying,
  deckBPlaying,
  deckATime,
  deckBTime,
  deckATempo,
  deckBTempo
}) {
  const [deckAPhase, setDeckAPhase] = useState(0);
  const [deckBPhase, setDeckBPhase] = useState(0);
  const [phaseDifference, setPhaseDifference] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!deckATrack?.bpm || !deckBTrack?.bpm) return;

    const intervalId = setInterval(() => {
      if (deckAPlaying || deckBPlaying) {
        // Calculate beat phases
        const effectiveBPMA = deckATrack.bpm * (1 + deckATempo / 100);
        const effectiveBPMB = deckBTrack.bpm * (1 + deckBTempo / 100);
        
        const beatIntervalA = 60 / effectiveBPMA;
        const beatIntervalB = 60 / effectiveBPMB;
        
        const phaseA = deckAPlaying ? (deckATime % beatIntervalA) / beatIntervalA : 0;
        const phaseB = deckBPlaying ? (deckBTime % beatIntervalB) / beatIntervalB : 0;
        
        setDeckAPhase(phaseA);
        setDeckBPhase(phaseB);
        
        // Calculate phase difference
        const diff = Math.abs(phaseA - phaseB);
        setPhaseDifference(Math.min(diff, 1 - diff));
        
        // Check if decks are synced (within 5% tolerance)
        setIsSynced(phaseDifference < 0.05 && Math.abs(effectiveBPMA - effectiveBPMB) < 2);
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [deckATrack, deckBTrack, deckAPlaying, deckBPlaying, deckATime, deckBTime, deckATempo, deckBTempo]);

  if (!deckATrack || !deckBTrack) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-zinc-500">
        <Activity className="w-4 h-4" />
        <span className="text-sm">Load tracks to see beatmatching</span>
      </div>
    );
  }

  const effectiveBPMA = deckATrack.bpm * (1 + deckATempo / 100);
  const effectiveBPMB = deckBTrack.bpm * (1 + deckBTempo / 100);
  const bpmDifference = effectiveBPMA - effectiveBPMB;

  return (
    <div className="bg-zinc-900/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-white">Beatmatching</span>
        </div>
        {isSynced && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-400">SYNCED</span>
          </div>
        )}
      </div>

      {/* Beat Phase Circles */}
      <div className="flex items-center justify-center gap-8">
        {/* Deck A Phase */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-zinc-700 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-t from-blue-500 to-transparent transition-transform duration-100"
              style={{ 
                transform: `translateY(${(1 - deckAPhase) * 100}%)`,
                opacity: deckAPlaying ? 1 : 0.3
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono text-white font-bold">
                {Math.round(effectiveBPMA)}
              </span>
            </div>
          </div>
          <div className="text-xs text-center mt-2 text-blue-400 font-medium">DECK A</div>
        </div>

        {/* Sync Indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "w-16 h-1 rounded-full transition-colors",
            isSynced ? "bg-green-500" : 
            phaseDifference < 0.15 ? "bg-yellow-500" : "bg-red-500"
          )} />
          <div className="text-xs font-mono text-zinc-400">
            {phaseDifference < 0.01 ? "0%" : `${(phaseDifference * 100).toFixed(0)}%`}
          </div>
          <div className={cn(
            "text-xs font-mono font-bold",
            Math.abs(bpmDifference) < 1 ? "text-green-400" :
            Math.abs(bpmDifference) < 3 ? "text-yellow-400" : "text-red-400"
          )}>
            {bpmDifference > 0 ? '+' : ''}{bpmDifference.toFixed(1)} BPM
          </div>
        </div>

        {/* Deck B Phase */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-zinc-700 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-t from-fuchsia-500 to-transparent transition-transform duration-100"
              style={{ 
                transform: `translateY(${(1 - deckBPhase) * 100}%)`,
                opacity: deckBPlaying ? 1 : 0.3
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono text-white font-bold">
                {Math.round(effectiveBPMB)}
              </span>
            </div>
          </div>
          <div className="text-xs text-center mt-2 text-fuchsia-400 font-medium">DECK B</div>
        </div>
      </div>

      {/* Visual Beat Pulses */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={`a-${i}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-100",
                deckAPlaying && deckAPhase > (i / 4) && deckAPhase < ((i + 1) / 4)
                  ? "bg-blue-500 scale-y-150"
                  : "bg-zinc-800"
              )}
            />
          ))}
        </div>
        <div className="space-y-1">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={`b-${i}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-100",
                deckBPlaying && deckBPhase > (i / 4) && deckBPhase < ((i + 1) / 4)
                  ? "bg-fuchsia-500 scale-y-150"
                  : "bg-zinc-800"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}