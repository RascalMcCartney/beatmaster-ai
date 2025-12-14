import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentlyPlayed({ listeningHistory }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-violet-400" />
        Recently Played ({listeningHistory.length})
      </h3>
      
      {listeningHistory.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No listening history yet</p>
          <p className="text-sm mt-1">Start playing tracks to build your history</p>
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-2 pr-4">
            {listeningHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-6 h-6 text-violet-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{item.track_title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-zinc-400 truncate">{item.track_artist || 'Unknown Artist'}</p>
                    {item.track_genre && (
                      <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                        {item.track_genre}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-zinc-400">
                    {item.played_at ? format(new Date(item.played_at), 'MMM d, h:mm a') : 'Unknown'}
                  </div>
                  {item.duration_played && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {formatDuration(item.duration_played)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}