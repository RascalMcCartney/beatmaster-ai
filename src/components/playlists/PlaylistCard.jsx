import React from 'react';
import { Play, MoreHorizontal, Music2, Users, Sparkles, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const GRADIENT_COLORS = [
  'from-violet-600 to-indigo-600',
  'from-fuchsia-600 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-600',
  'from-rose-500 to-red-600',
];

export default function PlaylistCard({ 
  playlist, 
  trackCount, 
  onClick, 
  onDelete,
  onEdit,
  onShare,
  isSelected 
}) {
  const gradientIndex = playlist.name.length % GRADIENT_COLORS.length;
  const gradient = GRADIENT_COLORS[gradientIndex];

  return (
    <div 
      className={cn(
        "group relative rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]",
        isSelected && "ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950"
      )}
      onClick={onClick}
    >
      {/* Cover */}
      <div className="aspect-square relative">
        {playlist.cover_url ? (
          <img 
            src={playlist.cover_url} 
            alt={playlist.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn(
            "w-full h-full bg-gradient-to-br flex items-center justify-center",
            gradient
          )}>
            <Music2 className="w-16 h-16 text-white/40" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <Button 
              size="icon"
              className="w-12 h-12 rounded-full bg-white text-black hover:bg-zinc-200 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <Play className="w-5 h-5 ml-0.5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="w-10 h-10 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800">
                <DropdownMenuItem 
                  className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                >
                  Edit playlist
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.();
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-400 focus:text-red-300 focus:bg-zinc-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  Delete playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-white truncate flex-1">{playlist.name}</h3>
          <div className="flex gap-1 flex-shrink-0">
            {playlist.is_smart && (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            {playlist.is_collaborative && (
              <Users className="w-3.5 h-3.5 text-violet-400" />
            )}
          </div>
        </div>
        <p className="text-sm text-zinc-400">
          {trackCount} track{trackCount !== 1 ? 's' : ''}
          {playlist.is_smart && ' • Smart'}
          {playlist.is_collaborative && playlist.collaborators?.length > 0 && (
            <> • {playlist.collaborators.length + 1} member{playlist.collaborators.length !== 0 ? 's' : ''}</>
          )}
        </p>
      </div>
    </div>
  );
}