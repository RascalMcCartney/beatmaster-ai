import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, Music2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function TransitionVisualizer({ 
  currentTrack, 
  nextTrack,
  crossfaderPosition,
  isTransitioning,
  isPlaying,
  activeTransitionType,
  onPlayPause,
  onSkip
}) {
  const transitionLabels = {
    quick_cut: 'Quick Cut',
    harmonic: 'Harmonic Mix',
    echo_out: 'Echo Out'
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Now Playing</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onPlayPause}
            size="lg"
            className="bg-violet-600 hover:bg-violet-700 h-12 w-12 rounded-full"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
          <Button
            onClick={onSkip}
            size="lg"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 h-12 w-12 rounded-full"
            disabled={!nextTrack}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Transition Visual */}
      <div className="space-y-4">
        {/* Current and Next Track Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Track */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all",
            isTransitioning 
              ? "bg-violet-500/10 border-violet-500/50" 
              : "bg-zinc-800 border-zinc-700"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                {currentTrack?.artwork_url ? (
                  <img src={currentTrack.artwork_url} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-2">
                  Current Track
                </Badge>
                <h3 className="font-semibold text-white truncate">
                  {currentTrack?.title || 'No track loaded'}
                </h3>
                <p className="text-sm text-zinc-400 truncate">
                  {currentTrack?.artist || '-'}
                </p>
              </div>
            </div>
            {currentTrack && (
              <div className="flex gap-2 mt-3">
                {currentTrack.bpm && (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-mono">
                    {currentTrack.bpm} BPM
                  </Badge>
                )}
                {currentTrack.camelot && (
                  <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                    {currentTrack.camelot}
                  </Badge>
                )}
                {currentTrack.energy && (
                  <Badge variant="outline" className="border-amber-700 text-amber-400 text-xs">
                    E: {currentTrack.energy}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Next Track */}
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all",
            isTransitioning 
              ? "bg-fuchsia-500/10 border-fuchsia-500/50" 
              : "bg-zinc-800 border-zinc-700"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                {nextTrack?.artwork_url ? (
                  <img src={nextTrack.artwork_url} alt={nextTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-zinc-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 mb-2">
                  Next Track
                </Badge>
                <h3 className="font-semibold text-white truncate">
                  {nextTrack?.title || 'No track queued'}
                </h3>
                <p className="text-sm text-zinc-400 truncate">
                  {nextTrack?.artist || '-'}
                </p>
              </div>
            </div>
            {nextTrack && (
              <div className="flex gap-2 mt-3">
                {nextTrack.bpm && (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-mono">
                    {nextTrack.bpm} BPM
                  </Badge>
                )}
                {nextTrack.camelot && (
                  <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                    {nextTrack.camelot}
                  </Badge>
                )}
                {nextTrack.energy && (
                  <Badge variant="outline" className="border-amber-700 text-amber-400 text-xs">
                    E: {nextTrack.energy}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Crossfader Visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={cn(
              "font-medium transition-colors",
              crossfaderPosition < 50 ? "text-violet-400" : "text-zinc-500"
            )}>
              Deck A
            </span>
            {isTransitioning && (
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse">
                  Transitioning
                </Badge>
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                  {transitionLabels[activeTransitionType] || 'Mixing'}
                </Badge>
              </div>
            )}
            <span className={cn(
              "font-medium transition-colors",
              crossfaderPosition > 50 ? "text-fuchsia-400" : "text-zinc-500"
            )}>
              Deck B
            </span>
          </div>
          
          <div className="relative h-8 bg-zinc-800 rounded-full overflow-hidden">
            {/* Crossfader fill */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
              style={{ width: `${crossfaderPosition}%` }}
            />
            
            {/* Crossfader knob */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300"
              style={{ left: `calc(${crossfaderPosition}% - 12px)` }}
            />
          </div>
          
          <div className="flex justify-between text-xs font-mono text-zinc-500">
            <span>{(100 - crossfaderPosition).toFixed(0)}%</span>
            <span>{crossfaderPosition.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}