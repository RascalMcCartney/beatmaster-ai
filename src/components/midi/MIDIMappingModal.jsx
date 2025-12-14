import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Radio, X } from 'lucide-react';
import { cn } from "@/lib/utils";

const CONTROL_DEFINITIONS = [
  { category: 'Deck A', controls: [
    { id: 'deckA.play', label: 'Play/Pause' },
    { id: 'deckA.tempo', label: 'Tempo' },
    { id: 'deckA.volume', label: 'Volume' },
    { id: 'deckA.eq.high', label: 'EQ High' },
    { id: 'deckA.eq.mid', label: 'EQ Mid' },
    { id: 'deckA.eq.low', label: 'EQ Low' },
    { id: 'deckA.cue1', label: 'Hot Cue 1' },
    { id: 'deckA.cue2', label: 'Hot Cue 2' },
    { id: 'deckA.cue3', label: 'Hot Cue 3' },
    { id: 'deckA.cue4', label: 'Hot Cue 4' },
  ]},
  { category: 'Deck B', controls: [
    { id: 'deckB.play', label: 'Play/Pause' },
    { id: 'deckB.tempo', label: 'Tempo' },
    { id: 'deckB.volume', label: 'Volume' },
    { id: 'deckB.eq.high', label: 'EQ High' },
    { id: 'deckB.eq.mid', label: 'EQ Mid' },
    { id: 'deckB.eq.low', label: 'EQ Low' },
    { id: 'deckB.cue1', label: 'Hot Cue 1' },
    { id: 'deckB.cue2', label: 'Hot Cue 2' },
    { id: 'deckB.cue3', label: 'Hot Cue 3' },
    { id: 'deckB.cue4', label: 'Hot Cue 4' },
  ]},
  { category: 'Mixer', controls: [
    { id: 'mixer.crossfader', label: 'Crossfader' },
    { id: 'mixer.master', label: 'Master Volume' },
    { id: 'mixer.headphone', label: 'Headphone Volume' },
    { id: 'mixer.cueA', label: 'Cue Deck A' },
    { id: 'mixer.cueB', label: 'Cue Deck B' },
  ]},
];

export default function MIDIMappingModal({ 
  open, 
  onOpenChange,
  devices,
  mappings,
  learningControl,
  onStartLearning,
  onStopLearning,
  onRemoveMapping,
  onClearAll
}) {
  const getMappingInfo = (controlId) => {
    const mapping = mappings[controlId];
    if (!mapping) return null;

    const messageTypes = {
      0xb0: 'CC',
      0x90: 'Note',
      0xe0: 'Pitch'
    };

    return `${messageTypes[mapping.messageType] || 'Unknown'} Ch${mapping.channel + 1} #${mapping.control}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">MIDI Controller Mapping</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {devices.length > 0 
              ? `Connected: ${devices.map(d => d.name).join(', ')}`
              : 'No MIDI devices detected'}
          </DialogDescription>
        </DialogHeader>

        {learningControl && (
          <div className="bg-violet-600 text-white p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="font-medium">Listening... Move a MIDI control to map it</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onStopLearning}
              className="text-white hover:bg-violet-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {CONTROL_DEFINITIONS.map(({ category, controls }) => (
              <div key={category}>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {controls.map(({ id, label }) => {
                    const mappingInfo = getMappingInfo(id);
                    const isLearning = learningControl === id;

                    return (
                      <div
                        key={id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          isLearning 
                            ? "bg-violet-600/20 border-violet-500" 
                            : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{label}</div>
                          {mappingInfo && (
                            <div className="text-xs text-zinc-400 font-mono mt-1">
                              {mappingInfo}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {mappingInfo && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveMapping(id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => isLearning ? onStopLearning() : onStartLearning(id)}
                            className={cn(
                              isLearning
                                ? "bg-violet-600 border-violet-500 text-white hover:bg-violet-700"
                                : "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            )}
                          >
                            {isLearning ? 'Cancel' : mappingInfo ? 'Remap' : 'Learn'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={onClearAll}
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            Clear All Mappings
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}