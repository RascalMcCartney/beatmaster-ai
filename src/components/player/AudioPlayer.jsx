import React, { useState, useRef, useEffect } from 'react';
import { SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react';
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
  audioRef 
}) {
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const waveformContainerRef = useRef(null);
  const waveformPlayerRef = useRef(null);

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
      if (waveformPlayerRef.current) {
        waveformPlayerRef.current.destroy();
        waveformPlayerRef.current = null;
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
    
    // Destroy existing waveform player if any
    if (waveformPlayerRef.current) {
      waveformPlayerRef.current.destroy();
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
      
      // Initialize waveform player with built-in controls
      waveformPlayerRef.current = new WaveformPlayer(waveformContainerRef.current, {
        url: audioUrl,
        title: currentTrack.title,
        subtitle: currentTrack.artist || 'Unknown Artist',
        artwork: artworkUrl,
        waveformStyle: 'mirror',
        height: 80,
        barWidth: 2,
        barSpacing: 1,
        samples: 200,
        waveformColor: 'rgba(139, 92, 246, 0.3)',
        progressColor: 'rgba(139, 92, 246, 0.9)',
        buttonColor: 'rgba(255, 255, 255, 0.9)',
        showTime: true,
        showBPM: false,
        showPlaybackSpeed: true,
        enableMediaSession: true,
        responsive: true
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
    } catch (error) {
      console.error('Failed to initialize waveform:', error);
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

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
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
    <div className="fixed bottom-0 left-0 right-0 z-50" style={{ height: '140px' }}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/95 via-zinc-950/98 to-black/95 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

      <audio ref={audioRef} src={currentTrack?.audio_url} style={{ display: 'none' }} />

      {/* Main Player Bar */}
      <div className="relative h-full">
        <div className="h-full px-4 md:px-8 flex flex-col justify-center gap-3">
          {/* Waveform Player (with built-in play/pause, time, waveform) */}
          <div 
            ref={waveformContainerRef}
            className="waveform-player-container"
          />
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