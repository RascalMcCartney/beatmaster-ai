import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Music2, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function TrackBrowser({ tracks, onSelect, onClose, activeDeck }) {
  const [search, setSearch] = useState('');

  const filteredTracks = useMemo(() => {
    if (!search.trim()) return tracks;
    
    const query = search.toLowerCase();
    return tracks.filter(track => 
      track.title?.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query) ||
      track.genre?.toLowerCase().includes(query) ||
      track.sub_genre?.toLowerCase().includes(query)
    );
  }, [tracks, search]);

  return (
    <div className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white">Track Browser</h3>
            {activeDeck && (
              <Badge className={cn(
                "text-xs",
                activeDeck === 'A' 
                  ? "bg-blue-600 text-white" 
                  : "bg-fuchsia-600 text-white"
              )}>
                For Deck {activeDeck}
              </Badge>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracks..."
            className="pl-10 bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-2 space-y-1">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tracks found</p>
            </div>
          ) : (
            filteredTracks.map(track => (
              <button
                key={track.id}
                onClick={() => onSelect(track)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {track.artwork_url ? (
                    <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-zinc-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-xs text-zinc-500 truncate">{track.artist || 'Unknown'}</p>
                  
                  <div className="flex gap-1.5 mt-1">
                    {track.bpm && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-mono px-1.5 py-0">
                        {track.bpm}
                      </Badge>
                    )}
                    {track.camelot && (
                      <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs px-1.5 py-0">
                        {track.camelot}
                      </Badge>
                    )}
                    {track.sub_genre && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs px-1.5 py-0">
                        {track.sub_genre}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}