import React from 'react';
import { Play, Pause, MoreHorizontal, Music2, Pencil, Trash2, Share2, Download, User, Disc } from 'lucide-react';
import DownloadButton from '@/components/offline/DownloadButton';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const formatDuration = (seconds) => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getEnergyColor = (energy) => {
  if (!energy) return 'bg-zinc-600';
  if (energy <= 3) return 'bg-blue-500';
  if (energy <= 5) return 'bg-green-500';
  if (energy <= 7) return 'bg-amber-500';
  return 'bg-red-500';
};

export default function TrackCard({ 
  track, 
  isPlaying, 
  isCurrentTrack, 
  onPlay, 
  onAddToPlaylist,
  onShowDetails,
  onEdit,
  onDelete,
  onShare,
  playlists,
  viewMode = 'grid' 
}) {
  const navigate = useNavigate();
  if (viewMode === 'list') {
    return (
      <div 
        className={cn(
          "group flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer",
          isCurrentTrack 
            ? "bg-violet-500/10 border border-violet-500/20" 
            : "hover:bg-white/5 border border-transparent"
        )}
        onClick={onPlay}
      >
        {/* Artwork */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          {track.artwork_url ? (
            <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-zinc-500" />
            </div>
          )}
          <div className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity",
            isCurrentTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium truncate",
            isCurrentTrack ? "text-violet-400" : "text-white"
          )}>
            {track.title}
          </h4>
          <p className="text-sm text-zinc-400 truncate">{track.artist || 'Unknown Artist'}</p>
        </div>

        {/* Album */}
        <div className="hidden md:block w-40 min-w-0">
          <p className="text-sm text-zinc-500 truncate">{track.album || '-'}</p>
        </div>

        {/* BPM */}
        <div className="hidden sm:block w-16 text-center">
          <span className="text-sm font-mono text-violet-400">{track.bpm || '-'}</span>
        </div>

        {/* Key */}
        <div className="hidden sm:block w-20 text-center">
          <span className="text-sm font-medium text-fuchsia-400">{track.key || '-'}</span>
        </div>

        {/* Energy */}
        <div className="hidden lg:flex w-20 justify-center">
          {track.energy && (
            <div className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", getEnergyColor(track.energy))} />
              <span className="text-sm text-zinc-400">{track.energy}</span>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="w-14 text-right">
          <span className="text-sm text-zinc-500 font-mono">{formatDuration(track.duration)}</span>
        </div>

        {/* More */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-400 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
            <DropdownMenuItem 
              className="text-zinc-300 focus:text-white focus:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Track
            </DropdownMenuItem>
            {track.artist && (
              <DropdownMenuItem 
                className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(createPageUrl('Artist') + `?name=${encodeURIComponent(track.artist)}`);
                }}
              >
                <User className="w-4 h-4 mr-2" />
                View Artist
              </DropdownMenuItem>
            )}
            {track.album && track.artist && (
              <DropdownMenuItem 
                className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(createPageUrl('Album') + `?name=${encodeURIComponent(track.album)}&artist=${encodeURIComponent(track.artist)}`);
                }}
              >
                <Disc className="w-4 h-4 mr-2" />
                View Album
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-zinc-300 focus:text-white focus:bg-zinc-800">
              Add to queue
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {playlists?.map(playlist => (
              <DropdownMenuItem 
                key={playlist.id}
                className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist?.(playlist.id);
                }}
              >
                Add to {playlist.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem 
              className="text-red-400 focus:text-red-300 focus:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Track
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Grid View
  return (
    <div 
      className={cn(
        "group relative rounded-2xl overflow-hidden transition-all cursor-pointer",
        isCurrentTrack 
          ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950" 
          : "hover:scale-[1.02]"
      )}
      onClick={onPlay}
    >
      {/* Artwork */}
      <div className="aspect-square relative">
        {track.artwork_url ? (
          <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
            <Music2 className="w-12 h-12 text-zinc-600" />
          </div>
        )}
        
        {/* Overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity",
          isCurrentTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {isCurrentTrack && isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </div>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 items-end">
          {track.bpm && (
            <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 text-xs font-mono">
              {track.bpm} BPM
            </Badge>
          )}
          {track.key && (
            <Badge className="bg-emerald-500/80 backdrop-blur-sm text-white border-0 text-xs w-fit">
              {track.key}
            </Badge>
          )}
          {track.danceability >= 8 && (
            <Badge className="bg-violet-500/80 backdrop-blur-sm text-white border-0 text-xs">
              🕺 Dancefloor
            </Badge>
          )}
          {track.track_type === 'instrumental' && (
            <Badge className="bg-fuchsia-500/80 backdrop-blur-sm text-white border-0 text-xs">
              Instrumental
            </Badge>
          )}
        </div>

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute bottom-2 right-2 h-8 w-8 bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 hover:bg-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
            <DropdownMenuItem 
              className="text-zinc-300 focus:text-white focus:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                onShowDetails?.();
              }}
            >
              <Info className="w-4 h-4 mr-2" />
              View Details
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
              className="text-zinc-300 focus:text-white focus:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Track
            </DropdownMenuItem>
            {track.artist && (
              <DropdownMenuItem 
                className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(createPageUrl('Artist') + `?name=${encodeURIComponent(track.artist)}`);
                }}
              >
                <User className="w-4 h-4 mr-2" />
                View Artist
              </DropdownMenuItem>
            )}
            {track.album && track.artist && (
              <DropdownMenuItem 
                className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(createPageUrl('Album') + `?name=${encodeURIComponent(track.album)}&artist=${encodeURIComponent(track.artist)}`);
                }}
              >
                <Disc className="w-4 h-4 mr-2" />
                View Album
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-zinc-300 focus:text-white focus:bg-zinc-800">
              Add to queue
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {playlists?.map(playlist => (
              <DropdownMenuItem 
                key={playlist.id}
                className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist?.(playlist.id);
                }}
              >
                Add to {playlist.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem 
              className="text-red-400 focus:text-red-300 focus:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Track
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info */}
      <div className="p-3 bg-zinc-900/80 backdrop-blur-sm">
        <h4 className={cn(
          "font-medium truncate",
          isCurrentTrack ? "text-violet-400" : "text-white"
        )}>
          {track.title}
        </h4>
        <p className="text-sm text-zinc-400 truncate">{track.artist || 'Unknown Artist'}</p>
        
        {/* Sub-genre Badge */}
        {track.sub_genre && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
              {track.sub_genre}
            </Badge>
          </div>
        )}
        
        {/* Bottom Stats */}
        <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
          <span className="font-mono">{formatDuration(track.duration)}</span>
          <div className="flex items-center gap-2">
            {track.mixability >= 8 && (
              <span className="text-violet-400">🎧</span>
            )}
            {track.energy && (
              <div className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", getEnergyColor(track.energy))} />
                <span>Energy {track.energy}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}