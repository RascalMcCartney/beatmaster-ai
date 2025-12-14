import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Music2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getCompatibleCamelotKeys } from '../utils/camelotWheel';

export default function HarmonicMixingIndicator({ trackA, trackB }) {
  if (!trackA || !trackB) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-center">
        <div className="text-center text-zinc-500">
          <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Load tracks on both decks</p>
        </div>
      </div>
    );
  }

  const keyA = trackA.camelot;
  const keyB = trackB.camelot;
  
  if (!keyA || !keyB) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Missing Key Data</span>
        </div>
        <p className="text-xs text-zinc-500">Tracks need Camelot key analysis</p>
      </div>
    );
  }

  const compatibleKeys = getCompatibleCamelotKeys(keyA);
  const isCompatible = compatibleKeys.includes(keyB);
  
  // Calculate BPM compatibility
  const bpmA = trackA.bpm;
  const bpmB = trackB.bpm;
  const bpmDiff = bpmA && bpmB ? Math.abs(bpmA - bpmB) : null;
  const bpmCompatible = bpmDiff !== null && (
    bpmDiff <= bpmA * 0.06 || // Within 6%
    Math.abs(bpmA - bpmB * 2) <= bpmA * 0.06 || // Double tempo
    Math.abs(bpmA * 2 - bpmB) <= bpmA * 0.06 // Half tempo
  );

  // Calculate overall compatibility
  let compatibility = 'poor';
  let compatScore = 0;
  
  if (isCompatible) compatScore += 50;
  if (bpmCompatible) compatScore += 30;
  if (trackA.genre === trackB.genre) compatScore += 10;
  if (trackA.energy && trackB.energy && Math.abs(trackA.energy - trackB.energy) <= 2) compatScore += 10;
  
  if (compatScore >= 80) compatibility = 'excellent';
  else if (compatScore >= 60) compatibility = 'good';
  else if (compatScore >= 40) compatibility = 'fair';

  const compatibilityConfig = {
    excellent: {
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-950/30',
      borderColor: 'border-green-800',
      label: 'Excellent Mix',
      description: 'Perfect harmonic match'
    },
    good: {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/30',
      borderColor: 'border-emerald-800',
      label: 'Good Mix',
      description: 'Compatible keys'
    },
    fair: {
      icon: AlertCircle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/30',
      borderColor: 'border-amber-800',
      label: 'Fair Mix',
      description: 'Requires careful mixing'
    },
    poor: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-950/30',
      borderColor: 'border-red-800',
      label: 'Difficult Mix',
      description: 'Keys clash'
    }
  };

  const config = compatibilityConfig[compatibility];
  const Icon = config.icon;

  return (
    <div className={cn("border rounded-xl p-4", config.bgColor, config.borderColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("border-blue-700 text-blue-400")}>
            {keyA}
          </Badge>
          <span className="text-zinc-600">→</span>
          <Badge variant="outline" className={cn("border-fuchsia-700 text-fuchsia-400")}>
            {keyB}
          </Badge>
        </div>
      </div>
      
      <p className="text-xs text-zinc-400 mb-3">{config.description}</p>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Harmonic Match</span>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isCompatible ? "bg-green-500" : "bg-red-500")} />
            <span className={isCompatible ? "text-green-400" : "text-red-400"}>
              {isCompatible ? 'Compatible' : 'Incompatible'}
            </span>
          </div>
        </div>
        
        {bpmDiff !== null && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">BPM Difference</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", bpmCompatible ? "bg-green-500" : "bg-amber-500")} />
              <span className={bpmCompatible ? "text-green-400" : "text-amber-400"}>
                {bpmDiff.toFixed(1)} BPM
              </span>
            </div>
          </div>
        )}
        
        {trackA.energy && trackB.energy && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Energy Match</span>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                Math.abs(trackA.energy - trackB.energy) <= 1 ? "bg-green-500" :
                Math.abs(trackA.energy - trackB.energy) <= 2 ? "bg-amber-500" : "bg-red-500"
              )} />
              <span className="text-zinc-400">
                {trackA.energy} → {trackB.energy}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Compatible Key Suggestions */}
      {!isCompatible && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">Compatible keys for {keyA}:</p>
          <div className="flex flex-wrap gap-1">
            {compatibleKeys.map(key => (
              <Badge 
                key={key} 
                variant="outline" 
                className={cn(
                  "text-xs",
                  key === keyB ? "border-red-700 text-red-400" : "border-zinc-700 text-zinc-400"
                )}
              >
                {key}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}