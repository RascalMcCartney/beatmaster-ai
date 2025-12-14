import React, { useState, useRef, useEffect } from 'react';
import { SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Loader2 } from 'lucide-react';
import { offlineStorage } from '@/components/offline/offlineStorage';
import DownloadButton from '@/components/offline/DownloadButton';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WaveformPlayer from '@arraypress/waveform-player';
import '@arraypress/waveform-player/dist/waveform-player.css';

export default function AudioPlayer({ 
  currentTrack, 
  isPlaying, 
  isBuffering,
  onPlayPause, 
  onNext, 
  onPrevious,
  onTimeUpdate,
  audioRef,
  waveformPlayerRef
}) {
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [waveformLoading, setWaveformLoading] = useState(false);
  const waveformContainerRef = useRef(null);
  const internalWaveformPlayerRef = waveformPlayerRef || useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      loadTrackAudio();
      initializeWaveform();
    }
    
    return () => {
      if (internalWaveformPlayerRef.current) {
        internalWaveformPlayerRef.current.destroy();
        internalWaveformPlayerRef.current = null;
      }
    };
  }, [currentTrack?.id]);

  const loadTrackAudio = async () => {
    if (!audioRef.current) return;
    
    try {
      await offlineStorage.init();
      const offlineTrack = await offlineStorage.getTrack(currentTrack.id);
      
      if (offlineTrack && offlineTrack.audioBlob) {
        const url = URL.createObjectURL(offlineTrack.audioBlob);
        if (audioRef.current) audioRef.current.src = url;
      } else {
        if (audioRef.current) audioRef.current.src = currentTrack.audio_url;
      }
    } catch (error) {
      if (audioRef.current) audioRef.current.src = currentTrack.audio_url;
    }
  };

  const initializeWaveform = async () => {
    if (!waveformContainerRef.current || !currentTrack) return;
    
    setWaveformLoading(true);
    
    // Destroy existing waveform player if any
    if (internalWaveformPlayerRef.current) {
      internalWaveformPlayerRef.current.destroy();
    }
    
    try {
      let audioUrl = currentTrack.audio_url;
      let artworkUrl = currentTrack.artwork_url;
      
      // Check for offline audio
      await offlineStorage.init();
      const offlineTrack = await offlineStorage.getTrack(currentTrack.id);
      if (offlineTrack && offlineTrack.audioBlob) {
        audioUrl = URL.createObjectURL(offlineTrack.audioBlob);
      }
      if (offlineTrack && offlineTrack.artworkBlob) {
        artworkUrl = URL.createObjectURL(offlineTrack.artworkBlob);
      }
      
      // Pre-generate waveform data
      await WaveformPlayer.generateWaveformData(audioUrl, 400);
      
      // Convert track structure to markers
      const markers = [];
      const colors = ['#4ade80', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
      let colorIndex = 0;
      
      if (currentTrack.structure && typeof currentTrack.structure === 'object') {
        Object.entries(currentTrack.structure).forEach(([key, value]) => {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          const color = colors[colorIndex % colors.length];
          colorIndex++;
          
          if (value && typeof value === 'object' && 'start' in value) {
            // Single object with start/end
            markers.push({
              time: value.start,
              label: label,
              color: color
            });
          } else if (Array.isArray(value)) {
            // Array of objects with start/end
            value.forEach((section, index) => {
              if (section && typeof section === 'object' && 'start' in section) {
                markers.push({
                  time: section.start,
                  label: value.length > 1 ? `${label} ${index + 1}` : label,
                  color: color
                });
              }
            });
          }
        });
      }
      // Initialize waveform player with built-in controls
      internalWaveformPlayerRef.current = new WaveformPlayer(waveformContainerRef.current, {
        url: audioUrl,
        title: currentTrack.title,
        subtitle: currentTrack.artist || 'Unknown Artist',
        artwork: artworkUrl,
        markers: markers.length > 0 ? markers : undefined,
        waveformStyle: 'mirror',
        height: 80,
        barWidth: 1,
        barSpacing: 1,
        samples: 400,
        waveformColor: 'rgba(29, 185, 84, 0.3)',
        progressColor: 'rgba(29, 185, 84, 0.9)',
        buttonColor: 'rgba(29, 185, 84, 0.9)',
        showTime: true,
        showBPM: true,
        showPlaybackSpeed: true,
        enableMediaSession: true,
        responsive: true,
        waveformInitialized: true
      });
      
      // Listen to play/pause events from waveform player
      waveformContainerRef.current.addEventListener('waveform:play', () => {
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play();
        }
      });
      
      waveformContainerRef.current.addEventListener('waveform:pause', () => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      });
      
      setWaveformLoading(false);
      
      // Auto-play if isPlaying is true
      if (isPlaying && internalWaveformPlayerRef.current) {
        setTimeout(() => {
          internalWaveformPlayerRef.current?.play();
        }, 100);
      }
    } catch (error) {
      console.error('Failed to initialize waveform:', error);
      setWaveformLoading(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        onNext?.();
      }
    };

    const handleTimeUpdate = () => {
      // Sync waveform player with audio element
      if (internalWaveformPlayerRef.current && audio.currentTime) {
        internalWaveformPlayerRef.current.setCurrentTime(audio.currentTime);
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [repeat, onNext]);

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-center text-zinc-500 text-sm">
        Select a track to start playing
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" style={{ height: '200px' }}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/95 via-zinc-950/98 to-black/95 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

      <audio ref={audioRef} src={currentTrack?.audio_url} style={{ display: 'none' }} />

      {/* Main Player Bar */}
      <div className="relative h-full">
        <div className="h-full px-4 md:px-8 flex flex-col justify-center gap-3">
          {/* Waveform Player (with built-in play/pause, time, waveform) */}
          <div className="relative">
            {waveformLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div 
              ref={waveformContainerRef}
              className="waveform-player-container"
            />
          {/* Controls Bar */}
          <div className="flex items-center justify-between px-2 pb-1">
            {/* Left: Skip Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={onPrevious}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={onNext}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Center: Repeat, Shuffle, Download */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 hover:bg-white/10",
                  shuffle ? "text-green-400" : "text-zinc-400 hover:text-white"
                )}
                onClick={() => setShuffle(!shuffle)}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 hover:bg-white/10",
                  repeat ? "text-green-400" : "text-zinc-400 hover:text-white"
                )}
                onClick={() => setRepeat(!repeat)}
              >
                <Repeat className="w-4 h-4" />
              </Button>
              <DownloadButton track={currentTrack} />
            </div>

            {/* Right: Volume Control */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={(value) => {
                  setVolume(value[0] / 100);
                  if (value[0] > 0 && isMuted) setIsMuted(false);
                }}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          </div>
          </div>
        </div>
      </div>

      <style>{`
        .waveform-player-container {
          --waveform-bg: transparent;
          --waveform-text: rgb(161 161 170);
          --waveform-button-bg: rgba(255, 255, 255, 0.1);
          --waveform-button-hover: rgba(255, 255, 255, 0.2);
        }

        .waveform-player-container .waveform-player {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        .waveform-player-container .waveform-controls {
          gap: 0.75rem !important;
        }
      `}</style>
    </div>
  );
  }