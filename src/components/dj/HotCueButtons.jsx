import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";

const HOT_CUE_COLORS = [
  'from-red-600 to-red-500',
  'from-blue-600 to-blue-500',
  'from-green-600 to-green-500',
  'from-yellow-600 to-yellow-500',
  'from-purple-600 to-purple-500',
  'from-pink-600 to-pink-500',
  'from-orange-600 to-orange-500',
  'from-cyan-600 to-cyan-500',
];

export default function HotCueButtons({ hotCues, onSetHotCue, onTriggerHotCue, onDeleteHotCue, disabled }) {
  const [activeCue, setActiveCue] = React.useState(null);

  const handleTrigger = (cue, index) => {
    setActiveCue(index);
    onTriggerHotCue(cue);
    setTimeout(() => setActiveCue(null), 200);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-zinc-400 uppercase">Hot Cues</h4>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(index => {
          const cue = hotCues[index];
          const isActive = activeCue === index;

          return (
            <div key={index} className="relative group">
              <Button
                disabled={disabled}
                onMouseDown={() => cue ? handleTrigger(cue, index) : onSetHotCue(index)}
                className={cn(
                  "w-full h-12 relative overflow-hidden transition-all duration-100",
                  cue 
                    ? `bg-gradient-to-br ${HOT_CUE_COLORS[index]} hover:opacity-90 text-white border-0`
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-500 border border-zinc-700",
                  isActive && "scale-95 shadow-lg ring-2 ring-white"
                )}
              >
                {/* Activation Flash */}
                {isActive && (
                  <div className="absolute inset-0 bg-white animate-pulse opacity-30" />
                )}
                
                <span className="font-mono font-bold text-sm relative z-10">
                  {cue ? `${index + 1}` : `${index + 1}`}
                </span>
                
                {/* Visual Pulse on Set Cue */}
                {cue && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <div className="w-1 h-1 bg-white/50 rounded-full" />
                    <div className="w-1 h-1 bg-white/50 rounded-full" />
                    <div className="w-1 h-1 bg-white/50 rounded-full" />
                  </div>
                )}
              </Button>

              {cue && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHotCue(index);
                  }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-3 h-3 text-zinc-400" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}