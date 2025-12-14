import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, GripVertical, Search, Sparkles, Music2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function AutoDJQueue({ 
  queue, 
  currentTrackIndex, 
  nextTrackIndex,
  allTracks,
  onAddToQueue,
  onRemoveFromQueue,
  onReorderQueue,
  onGenerateSmartQueue
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBrowser, setShowBrowser] = useState(false);

  const filteredTracks = allTracks.filter(track =>
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderQueue(items);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Queue */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Queue ({queue.length})</h2>
          <div className="flex gap-2">
            <Button
              onClick={onGenerateSmartQueue}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
              disabled={queue.length === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Smart Fill
            </Button>
            <Button
              onClick={() => setShowBrowser(!showBrowser)}
              size="sm"
              variant="outline"
              className="bg-zinc-800 border-zinc-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tracks in queue</p>
              <p className="text-sm mt-1">Add tracks to start Auto-DJ</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="queue">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {queue.map((track, index) => (
                      <Draggable key={track.id} draggableId={track.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all",
                              index === currentTrackIndex
                                ? "bg-violet-500/20 border-violet-500/50"
                                : index === nextTrackIndex
                                ? "bg-fuchsia-500/20 border-fuchsia-500/50"
                                : "bg-zinc-800 border-zinc-700 hover:border-zinc-600",
                              snapshot.isDragging && "shadow-2xl scale-105"
                            )}
                          >
                            <div {...provided.dragHandleProps} className="text-zinc-500 hover:text-white cursor-grab">
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                              {track.artwork_url ? (
                                <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                  <Music2 className="w-4 h-4 text-zinc-500" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
                              <p className="text-xs text-zinc-500 truncate">{track.artist || 'Unknown Artist'}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              {index === currentTrackIndex && (
                                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                                  Now
                                </Badge>
                              )}
                              {index === nextTrackIndex && (
                                <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                                  Next
                                </Badge>
                              )}
                              {track.bpm && (
                                <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-mono">
                                  {track.bpm}
                                </Badge>
                              )}
                              {track.camelot && (
                                <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                                  {track.camelot}
                                </Badge>
                              )}
                            </div>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-zinc-500 hover:text-red-400"
                              onClick={() => onRemoveFromQueue(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </ScrollArea>
      </div>

      {/* Track Browser */}
      {showBrowser && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Track Library</h2>
            <Button
              onClick={() => setShowBrowser(false)}
              size="sm"
              variant="ghost"
              className="text-zinc-400"
            >
              Close
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks..."
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="h-[550px] overflow-y-auto overflow-x-hidden">
            <div className="space-y-2 pr-4">
              {filteredTracks.map(track => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-zinc-600 transition-all min-w-0"
                >
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    {track.artwork_url ? (
                      <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                        <Music2 className="w-4 h-4 text-zinc-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
                    <p className="text-xs text-zinc-500 truncate">{track.artist || 'Unknown Artist'}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {track.bpm && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-mono">
                        {track.bpm}
                      </Badge>
                    )}
                    {track.camelot && (
                      <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                        {track.camelot}
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-zinc-400 hover:text-violet-400 flex-shrink-0"
                    onClick={() => onAddToQueue(track)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}