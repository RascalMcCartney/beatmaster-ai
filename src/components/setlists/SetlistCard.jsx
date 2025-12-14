import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Music2, Clock, MoreVertical, Edit3, Trash2, TrendingUp } from 'lucide-react';

export default function SetlistCard({ setlist, onPlay, onEdit, onDelete }) {
  const trackCount = setlist.tracks?.length || 0;
  const totalDuration = setlist.duration_minutes || 0;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate mb-1">
              {setlist.name}
            </h3>
            {setlist.target_mood && (
              <Badge variant="outline" className="border-violet-500/50 text-violet-300">
                {setlist.target_mood}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem onClick={onEdit} className="text-white">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {setlist.description && (
          <p className="text-sm text-zinc-400 line-clamp-2">
            {setlist.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-1">
            <Music2 className="w-4 h-4" />
            <span>{trackCount} tracks</span>
          </div>
          {totalDuration > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{totalDuration} min</span>
            </div>
          )}
        </div>

        {setlist.energy_curve && setlist.energy_curve.length > 0 && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div className="flex-1 flex items-end gap-0.5 h-8">
              {setlist.energy_curve.slice(0, 20).map((energy, i) => (
                <div
                  key={i}
                  className="flex-1 bg-emerald-500/30 rounded-t"
                  style={{ height: `${(energy / 10) * 100}%`, minHeight: '2px' }}
                />
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={onPlay}
          className="w-full bg-violet-600 hover:bg-violet-700"
          disabled={trackCount === 0}
        >
          <Play className="w-4 h-4 mr-2" />
          Start Setlist
        </Button>
      </CardContent>
    </Card>
  );
}