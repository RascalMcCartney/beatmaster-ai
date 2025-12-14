import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Music2, GripVertical, Plus, X, Search } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function CreateSetlistModal({ open, onOpenChange, setlist, tracks, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetMood, setTargetMood] = useState('');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrackBrowser, setShowTrackBrowser] = useState(false);

  useEffect(() => {
    if (setlist) {
      setName(setlist.name || '');
      setDescription(setlist.description || '');
      setTargetMood(setlist.target_mood || '');
      setSelectedTracks(setlist.tracks || []);
    } else {
      setName('');
      setDescription('');
      setTargetMood('');
      setSelectedTracks([]);
    }
  }, [setlist, open]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(selectedTracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));

    setSelectedTracks(updatedItems);
  };

  const handleAddTrack = (track) => {
    const newTrack = {
      track_id: track.id,
      track_title: track.title,
      track_artist: track.artist,
      position: selectedTracks.length,
      mixing_notes: '',
      transition_type: 'blend',
    };
    setSelectedTracks([...selectedTracks, newTrack]);
    setSearchQuery('');
  };

  const handleRemoveTrack = (index) => {
    const updated = selectedTracks.filter((_, i) => i !== index);
    setSelectedTracks(updated.map((item, i) => ({ ...item, position: i })));
  };

  const handleUpdateNotes = (index, notes) => {
    const updated = [...selectedTracks];
    updated[index] = { ...updated[index], mixing_notes: notes };
    setSelectedTracks(updated);
  };

  const handleSave = () => {
    const data = {
      name,
      description,
      target_mood: targetMood,
      tracks: selectedTracks,
      duration_minutes: 0, // Can calculate from track durations
    };
    onSave(data);
  };

  const filteredTracks = tracks.filter(track => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const isAlreadyAdded = selectedTracks.some(st => st.track_id === track.id);
    return !isAlreadyAdded && (
      track.title?.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {setlist ? 'Edit Setlist' : 'Create Setlist'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Setlist name"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="bg-zinc-800 border-zinc-700 text-white h-20"
            />
            <Input
              value={targetMood}
              onChange={(e) => setTargetMood(e.target.value)}
              placeholder="Target mood (e.g., energetic, chill)"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Tracks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase">
                Tracks ({selectedTracks.length})
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTrackBrowser(!showTrackBrowser)}
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tracks
              </Button>
            </div>

            {showTrackBrowser && (
              <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tracks..."
                    className="pl-10 bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {filteredTracks.slice(0, 20).map(track => (
                      <button
                        key={track.id}
                        onClick={() => handleAddTrack(track)}
                        className="w-full flex items-center gap-3 p-2 rounded hover:bg-zinc-700 transition-colors text-left"
                      >
                        <Music2 className="w-4 h-4 text-zinc-500" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{track.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{track.artist}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <ScrollArea className="h-[300px]">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="setlist-tracks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {selectedTracks.map((track, index) => (
                        <Draggable key={`${track.track_id}-${index}`} draggableId={`${track.track_id}-${index}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "bg-zinc-800/50 rounded-lg border border-zinc-700 p-3",
                                snapshot.isDragging && "bg-zinc-800 shadow-lg"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div {...provided.dragHandleProps} className="mt-1">
                                  <GripVertical className="w-5 h-5 text-zinc-500" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-zinc-500">#{index + 1}</span>
                                        <span className="text-sm font-medium truncate">{track.track_title}</span>
                                      </div>
                                      {track.track_artist && (
                                        <div className="text-xs text-zinc-500 truncate">{track.track_artist}</div>
                                      )}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleRemoveTrack(index)}
                                      className="h-6 w-6 text-zinc-500 hover:text-red-400"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={track.mixing_notes || ''}
                                    onChange={(e) => handleUpdateNotes(index, e.target.value)}
                                    placeholder="Mixing notes..."
                                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {selectedTracks.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tracks added yet</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || selectedTracks.length === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {setlist ? 'Save Changes' : 'Create Setlist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}