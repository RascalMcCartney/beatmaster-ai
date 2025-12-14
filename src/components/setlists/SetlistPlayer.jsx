import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Music2,
  Volume2,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import AudioPlayer from '@/components/player/AudioPlayer';

export default function SetlistPlayer({ setlist, tracks, onClose, onUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedTracks, setCompletedTracks] = useState(new Set());
  const audioRef = useRef(null);

  const currentSetlistTrack = setlist.tracks[currentIndex];
  const currentTrack = tracks.find(t => t.id === currentSetlistTrack?.track_id);
  const progress = ((currentIndex + 1) / setlist.tracks.length) * 100;

  const handleNext = () => {
    if (currentIndex < setlist.tracks.length - 1) {
      setCompletedTracks(prev => new Set([...prev, currentIndex]));
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTrackSelect = (index) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  return (
    <div className="min-h-screen bg-zinc-950 pb-32">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1">{setlist.name}</h1>
            <p className="text-sm text-zinc-400">
              Track {currentIndex + 1} of {setlist.tracks.length}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-zinc-400 font-medium">Setlist Progress</span>
            <span className="text-sm text-zinc-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Now Playing */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-start gap-6">
                <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                  {currentTrack?.artwork_url ? (
                    <img 
                      src={currentTrack.artwork_url} 
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                      <Music2 className="w-20 h-20 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {currentTrack?.title || 'No track loaded'}
                    </h2>
                    <p className="text-lg text-zinc-400">
                      {currentTrack?.artist || 'Unknown Artist'}
                    </p>
                  </div>

                  {currentSetlistTrack?.mixing_notes && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Mixing Notes</h3>
                      <p className="text-sm text-zinc-300">{currentSetlistTrack.mixing_notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-6">
                    {currentTrack?.bpm && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">BPM</div>
                        <div className="text-2xl font-bold text-white">{currentTrack.bpm}</div>
                      </div>
                    )}
                    {currentTrack?.key && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Key</div>
                        <div className="text-2xl font-bold text-white">{currentTrack.key}</div>
                      </div>
                    )}
                    {currentTrack?.energy && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Energy</div>
                        <div className="text-2xl font-bold text-white">{currentTrack.energy}/10</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transport Controls */}
              <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={handlePlayPause}
                    size="icon"
                    className="h-16 w-16 rounded-full bg-violet-600 hover:bg-violet-700"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === setlist.tracks.length - 1}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Up Next */}
            {currentIndex < setlist.tracks.length - 1 && (
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Up Next
                </h3>
                {(() => {
                  const nextTrack = setlist.tracks[currentIndex + 1];
                  const nextTrackData = tracks.find(t => t.id === nextTrack?.track_id);
                  return nextTrackData && (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded overflow-hidden">
                        {nextTrackData.artwork_url ? (
                          <img src={nextTrackData.artwork_url} alt={nextTrackData.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Music2 className="w-6 h-6 text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{nextTrackData.title}</h4>
                        <p className="text-sm text-zinc-400 truncate">{nextTrackData.artist}</p>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            )}
          </div>

          {/* Tracklist */}
          <div>
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4">Full Setlist</h3>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-2">
                  {setlist.tracks.map((setlistTrack, index) => {
                    const track = tracks.find(t => t.id === setlistTrack.track_id);
                    if (!track) return null;

                    const isCurrent = index === currentIndex;
                    const isCompleted = completedTracks.has(index);

                    return (
                      <button
                        key={index}
                        onClick={() => handleTrackSelect(index)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                          isCurrent
                            ? "bg-violet-600 text-white"
                            : isCompleted
                            ? "bg-zinc-800/50 text-zinc-400"
                            : "bg-zinc-800/30 text-white hover:bg-zinc-800"
                        )}
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black/20 text-xs font-bold flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{track.title}</div>
                          <div className="text-xs opacity-75 truncate">{track.artist}</div>
                        </div>
                        {isCurrent && (
                          <Volume2 className="w-4 h-4 animate-pulse flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        audioRef={audioRef}
      />
    </div>
  );
}