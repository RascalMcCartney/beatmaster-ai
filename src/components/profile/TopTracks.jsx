import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2, TrendingUp } from 'lucide-react';

export default function TopTracks({ tracks }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-violet-400" />
        Most Played Tracks
      </h3>

      {tracks.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No play data available yet</p>
        </div>
      ) : (
        <ScrollArea className="h-96">
          <div className="space-y-2 pr-4">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="w-8 h-8 rounded flex items-center justify-center bg-violet-500/20 text-violet-400 font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </div>

                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {track.artwork_url ? (
                    <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
                      <Music2 className="w-6 h-6 text-violet-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{track.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-zinc-400 truncate">{track.artist || 'Unknown Artist'}</p>
                    {track.sub_genre && (
                      <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                        {track.sub_genre}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {track.bpm && (
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                      {track.bpm} BPM
                    </Badge>
                  )}
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {track.playCount} plays
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}