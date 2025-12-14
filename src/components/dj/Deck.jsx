import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Music2, Link as LinkIcon, Plus, Minus } from 'lucide-react';
import { cn } from "@/lib/utils";
import DeckWaveform from './DeckWaveform';
import HotCueButtons from './HotCueButtons';
import { toast } from 'sonner';

export default function Deck({ 
  deck, 
  track, 
  isPlaying, 
  onPlayPause, 
  audioRef,
  audioContext,
  onLoadTrack,
  volume,
  syncTarget,
  onTimeUpdate,
  onTempoChange
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempo] = useState(0);
  const [pitchBend, setPitchBend] = useState(0);
  const [cuePoints, setCuePoints] = useState([]);
  const [hotCues, setHotCues] = useState([]);
  const [loopStart, setLoopStart] = useState(null);
  const [loopEnd, setLoopEnd] = useState(null);
  const [isLooping, setIsLooping] = useState(false);
  const [detectedBPM, setDetectedBPM] = useState(null);
  const [beatPhase, setBeatPhase] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime);
      }
      
      if (track?.bpm) {
        const beatInterval = 60 / (track.bpm * (1 + tempo / 100));
        setBeatPhase((audio.currentTime % beatInterval) / beatInterval);
      }
      
      if (isLooping && loopEnd && audio.currentTime >= loopEnd) {
        audio.currentTime = loopStart || 0;
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setTempo(0);
      setDetectedBPM(null);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isLooping, loopStart, loopEnd, track, tempo]);

  // Apply tempo and pitch bend changes
  useEffect(() => {
    if (audioRef.current) {
      const rate = 1 + ((tempo + pitchBend) / 100);
      audioRef.current.playbackRate = Math.max(0.5, Math.min(2, rate));
    }
    
    if (onTempoChange) {
      onTempoChange(tempo);
    }
  }, [tempo, pitchBend]);

  // Control playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error('Playback error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, track]);

  const handleSync = () => {
    if (!track?.bpm || !syncTarget?.bpm) {
      toast.error('Both tracks need BPM data for sync');
      return;
    }
    
    const tempoChange = ((syncTarget.bpm - track.bpm) / track.bpm) * 100;
    setTempo(tempoChange);
    toast.success(`Synced to ${syncTarget.bpm} BPM`);
  };

  const handleAddCuePoint = () => {
    if (!track) return;
    const newCue = {
      id: Date.now(),
      time: currentTime,
      label: `Cue ${cuePoints.length + 1}`
    };
    setCuePoints([...cuePoints, newCue]);
    toast.success('Cue point added');
  };

  const handleJumpToCue = (cueTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = cueTime;
    }
  };

  const handleSetLoopStart = () => {
    setLoopStart(currentTime);
    toast.success('Loop start set');
  };

  const handleSetLoopEnd = () => {
    if (!loopStart) {
      toast.error('Set loop start first');
      return;
    }
    setLoopEnd(currentTime);
    setIsLooping(true);
    toast.success('Loop enabled');
  };

  const handleClearLoop = () => {
    setLoopStart(null);
    setLoopEnd(null);
    setIsLooping(false);
    toast.success('Loop cleared');
  };

  const handleSetHotCue = (index) => {
    const newHotCues = [...hotCues];
    newHotCues[index] = {
      time: currentTime,
      label: `Cue ${index + 1}`
    };
    setHotCues(newHotCues);
    toast.success(`Hot cue ${index + 1} set`);
  };

  const handleTriggerHotCue = (cue) => {
    if (audioRef.current) {
      audioRef.current.currentTime = cue.time;
      if (!isPlaying) {
        onPlayPause();
      }
    }
  };

  const handleDeleteHotCue = (index) => {
    const newHotCues = [...hotCues];
    newHotCues[index] = null;
    setHotCues(newHotCues);
    toast.success(`Hot cue ${index + 1} deleted`);
  };

  const handleSeek = (value) => {
    const time = Array.isArray(value) ? value[0] : value;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
      <audio 
        ref={audioRef} 
        src={track?.audio_url}
        crossOrigin="anonymous"
        preload="auto"
      />
      
      {/* Header */}
      <div className={cn(
        "h-12 flex items-center justify-between px-4 border-b border-zinc-800 flex-shrink-0",
        deck === 'A' ? "bg-blue-950/30" : "bg-fuchsia-950/30"
      )}>
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-2xl font-bold",
            deck === 'A' ? "text-blue-400" : "text-fuchsia-400"
          )}>
            DECK {deck}
          </span>
          <div className={cn(
            "w-3 h-3 rounded-full transition-all duration-100",
            beatPhase < 0.2 ? (deck === 'A' ? "bg-blue-500 scale-150" : "bg-fuchsia-500 scale-150") : "bg-zinc-700 scale-100"
          )} />
          {track?.bpm && (
            <span className="text-sm font-mono text-zinc-400">
              {Math.round(track.bpm * (1 + tempo / 100))} BPM
            </span>
          )}
          {detectedBPM && (
            <span className="text-xs font-mono text-amber-400">
              Detected: {detectedBPM}
            </span>
          )}
          {track?.camelot && (
            <span className="text-sm font-medium text-emerald-400">
              {track.camelot}
            </span>
          )}
        </div>
        <Button
          onClick={handleSync}
          variant="outline"
          size="sm"
          disabled={!track || !syncTarget}
          className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          SYNC
        </Button>
      </div>

      {/* Track Info with Analysis Status */}
      <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        {track ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
              {track.artwork_url ? (
                <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className={cn(
                  "w-full h-full flex items-center justify-center",
                  deck === 'A' ? "bg-blue-600" : "bg-fuchsia-600"
                )}>
                  <Music2 className="w-6 h-6 text-white" />
                </div>
              )}
              {/* Analysis Status Indicator */}
              {track.analysis_status === 'complete' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
              {track.analysis_status === 'analyzing' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{track.title}</h3>
              <p className="text-sm text-zinc-400 truncate">{track.artist || 'Unknown Artist'}</p>
            </div>
            <Button
              onClick={onPlayPause}
              size="lg"
              className={cn(
                "h-12 w-12 rounded-full flex-shrink-0 relative",
                deck === 'A' ? "bg-blue-600 hover:bg-blue-700" : "bg-fuchsia-600 hover:bg-fuchsia-700"
              )}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              {/* Playback Pulse */}
              {isPlaying && (
                <div className={cn(
                  "absolute inset-0 rounded-full animate-ping opacity-20",
                  deck === 'A' ? "bg-blue-400" : "bg-fuchsia-400"
                )} />
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={onLoadTrack}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            Load Track
          </Button>
        )}
      </div>

      {/* Waveform with Progress Bar */}
      <div className="p-4 h-48 flex-shrink-0 overflow-hidden space-y-2">
        <DeckWaveform
          currentTime={currentTime}
          duration={duration}
          bpm={track?.bpm}
          structure={track?.structure}
          onSeek={handleSeek}
          cuePoints={cuePoints}
          loopStart={loopStart}
          loopEnd={loopEnd}
          deckColor={deck === 'A' ? 'blue' : 'fuchsia'}
        />
        {/* Progress bar */}
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-100",
              deck === 'A' ? "bg-gradient-to-r from-blue-600 to-blue-400" : "bg-gradient-to-r from-fuchsia-600 to-fuchsia-400"
            )}
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex-1 border-t border-zinc-800 overflow-y-auto">
        <div className="p-4 space-y-4">
        {/* Time Display */}
        <div className="flex items-center justify-between text-sm font-mono text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Tempo Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 uppercase">Tempo</span>
            <span className={cn(
              "text-sm font-mono font-bold",
              tempo > 0 ? "text-red-400" : tempo < 0 ? "text-blue-400" : "text-zinc-400"
            )}>
              {tempo > 0 ? '+' : ''}{tempo.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setTempo(Math.max(-50, tempo - 0.5))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Slider
              value={[tempo]}
              onValueChange={(v) => setTempo(v[0])}
              min={-50}
              max={50}
              step={0.1}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setTempo(Math.min(50, tempo + 0.5))}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setTempo(0)}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pitch Bend Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 uppercase">Pitch Bend</span>
            <span className={cn(
              "text-xs font-mono font-bold",
              pitchBend > 0 ? "text-red-400" : pitchBend < 0 ? "text-blue-400" : "text-zinc-400"
            )}>
              {pitchBend > 0 ? '+' : ''}{pitchBend.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-blue-600"
              onMouseDown={() => setPitchBend(-3)}
              onMouseUp={() => setPitchBend(0)}
              onMouseLeave={() => setPitchBend(0)}
              onTouchStart={() => setPitchBend(-3)}
              onTouchEnd={() => setPitchBend(0)}
            >
              −
            </Button>
            <div className="flex-1 text-center">
              <div className={cn(
                "h-1 rounded-full transition-all",
                pitchBend === 0 ? "bg-zinc-700" : 
                pitchBend > 0 ? "bg-red-500" : "bg-blue-500"
              )} style={{ width: `${Math.abs(pitchBend / 3 * 100)}%`, margin: '0 auto' }} />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-red-600"
              onMouseDown={() => setPitchBend(3)}
              onMouseUp={() => setPitchBend(0)}
              onMouseLeave={() => setPitchBend(0)}
              onTouchStart={() => setPitchBend(3)}
              onTouchEnd={() => setPitchBend(0)}
            >
              +
            </Button>
          </div>
        </div>

        {/* Cue Points & Loops */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleAddCuePoint}
            disabled={!track}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            Set Cue
          </Button>
          <Button
            onClick={handleSetLoopStart}
            disabled={!track}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            Loop Start
          </Button>
          <Button
            onClick={handleSetLoopEnd}
            disabled={!track || !loopStart}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            Loop End
          </Button>
          <Button
            onClick={handleClearLoop}
            disabled={!isLooping}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            Clear Loop
          </Button>
        </div>

        {/* Hot Cues */}
        <HotCueButtons
          hotCues={hotCues.filter(Boolean)}
          onSetHotCue={handleSetHotCue}
          onTriggerHotCue={handleTriggerHotCue}
          onDeleteHotCue={handleDeleteHotCue}
          disabled={!track}
        />

        {/* Cue Points List */}
        {cuePoints.length > 0 && (
          <div className="space-y-1">
            {cuePoints.slice(-4).map(cue => (
              <button
                key={cue.id}
                onClick={() => handleJumpToCue(cue.time)}
                className="w-full text-left px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 font-mono"
              >
                {cue.label} - {formatTime(cue.time)}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}