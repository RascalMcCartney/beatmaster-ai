import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AutoDJQueue from '@/components/autodj/AutoDJQueue';
import AutoDJControls from '@/components/autodj/AutoDJControls';
import TransitionVisualizer from '@/components/autodj/TransitionVisualizer';
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCompatibilityScore } from '@/components/utils/camelotWheel';
import { 
  calculateBeatMatchedTransition, 
  calculateEntryPoint, 
  getTransitionParameters,
  getCrossfadeCurve,
  suggestTransitionType 
} from '@/components/utils/mixingStrategies';

export default function AutoDJ() {
  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [nextTrackIndex, setNextTrackIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mixingStyle, setMixingStyle] = useState('balanced'); // smooth, balanced, energetic
  const [transitionType, setTransitionType] = useState('auto'); // auto, quick_cut, harmonic, echo_out
  const [transitionDuration, setTransitionDuration] = useState(16); // seconds
  const [crossfaderPosition, setCrossfaderPosition] = useState(0); // 0-100
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTransitionType, setActiveTransitionType] = useState('harmonic');

  const audioRefA = useRef(null);
  const audioRefB = useRef(null);
  const transitionTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef({});

  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-updated_date'),
  });

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Setup audio routing
  useEffect(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext || !audioRefA.current || !audioRefB.current) return;

    if (!audioNodesRef.current.sourceA) {
      const sourceA = audioContext.createMediaElementSource(audioRefA.current);
      const sourceB = audioContext.createMediaElementSource(audioRefB.current);
      const gainA = audioContext.createGain();
      const gainB = audioContext.createGain();
      const masterGain = audioContext.createGain();

      sourceA.connect(gainA).connect(masterGain);
      sourceB.connect(gainB).connect(masterGain);
      masterGain.connect(audioContext.destination);

      gainA.gain.value = 1;
      gainB.gain.value = 0;
      masterGain.gain.value = 0.8;

      audioNodesRef.current = { sourceA, sourceB, gainA, gainB, masterGain };
    }
  }, []);

  const currentTrack = queue[currentTrackIndex];
  const nextTrack = queue[nextTrackIndex];

  const findBestTransitionPoint = (track, nextTrack) => {
    if (!track?.duration) {
      return track?.duration ? track.duration - transitionDuration : 30;
    }

    // Determine transition type
    const compatScore = calculateCompatibilityScore(track, nextTrack);
    let effectiveTransitionType = transitionType;
    
    if (transitionType === 'auto') {
      effectiveTransitionType = suggestTransitionType(track, nextTrack, compatScore);
      setActiveTransitionType(effectiveTransitionType);
    } else {
      setActiveTransitionType(transitionType);
    }

    // Use beat-matched phrase alignment
    return calculateBeatMatchedTransition(track, effectiveTransitionType, mixingStyle);
  };

  const startTransition = () => {
    if (!nextTrack || isTransitioning) return;

    setIsTransitioning(true);
    
    // Get transition parameters based on compatibility and type
    const compatScore = calculateCompatibilityScore(currentTrack, nextTrack);
    const effectiveType = transitionType === 'auto' 
      ? suggestTransitionType(currentTrack, nextTrack, compatScore)
      : transitionType;
    
    const transitionParams = getTransitionParameters(
      currentTrack, 
      nextTrack, 
      effectiveType, 
      compatScore
    );

    // Calculate entry point for next track
    const entryPoint = calculateEntryPoint(nextTrack, effectiveType);
    if (audioRefB.current) {
      audioRefB.current.currentTime = entryPoint;
    }

    const duration = transitionParams.duration;
    const steps = 60; // smooth crossfade steps
    const stepDuration = (duration * 1000) / steps;

    let step = 0;
    const transitionInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      
      // Use appropriate crossfade curve
      const { fadeOut, fadeIn } = getCrossfadeCurve(progress, transitionParams.curve);
      
      if (audioNodesRef.current.gainA && audioNodesRef.current.gainB) {
        audioNodesRef.current.gainA.gain.value = fadeOut;
        audioNodesRef.current.gainB.gain.value = fadeIn;
      }
      
      setCrossfaderPosition(progress * 100);

      if (step >= steps) {
        clearInterval(transitionInterval);
        completeTransition();
      }
    }, stepDuration);

    transitionTimerRef.current = transitionInterval;
  };

  const completeTransition = () => {
    setIsTransitioning(false);
    
    // Swap decks
    if (audioRefA.current) {
      audioRefA.current.pause();
      audioRefA.current.currentTime = 0;
    }
    
    // Move to next track
    const newCurrentIndex = nextTrackIndex;
    const newNextIndex = (nextTrackIndex + 1) % queue.length;
    
    setCurrentTrackIndex(newCurrentIndex);
    setNextTrackIndex(newNextIndex);
    setCrossfaderPosition(0);
    
    // Reset gains
    if (audioNodesRef.current.gainA && audioNodesRef.current.gainB) {
      audioNodesRef.current.gainA.gain.value = 1;
      audioNodesRef.current.gainB.gain.value = 0;
    }
  };

  // Monitor playback for auto-transition
  useEffect(() => {
    const audioA = audioRefA.current;
    if (!audioA || !currentTrack || !isPlaying) return;

    const handleTimeUpdate = () => {
      const transitionPoint = findBestTransitionPoint(currentTrack, nextTrack);
      
      if (audioA.currentTime >= transitionPoint && !isTransitioning && nextTrack) {
        // Start playing next track
        if (audioRefB.current) {
          audioRefB.current.play();
        }
        startTransition();
      }
    };

    audioA.addEventListener('timeupdate', handleTimeUpdate);
    return () => audioA.removeEventListener('timeupdate', handleTimeUpdate);
  }, [currentTrack, nextTrack, isPlaying, isTransitioning, mixingStyle]);

  const handlePlayPause = async () => {
    if (queue.length === 0) {
      toast.error('Add tracks to queue first');
      return;
    }

    // Resume audio context if suspended
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRefA.current?.pause();
      audioRefB.current?.pause();
    } else {
      audioRefA.current?.play().catch(err => {
        console.error('Playback failed:', err);
        toast.error('Failed to start playback');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkip = () => {
    if (isTransitioning) {
      clearInterval(transitionTimerRef.current);
    }
    completeTransition();
  };

  const handleAddToQueue = (track) => {
    setQueue([...queue, track]);
    toast.success('Added to Auto-DJ queue');
  };

  const handleRemoveFromQueue = (index) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    
    // Adjust indices if needed
    if (index === currentTrackIndex) {
      setCurrentTrackIndex(0);
      setNextTrackIndex(1);
    } else if (index < currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setNextTrackIndex(nextTrackIndex - 1);
    }
  };

  const handleReorderQueue = (newQueue) => {
    setQueue(newQueue);
  };

  const handleGenerateSmartQueue = () => {
    if (queue.length === 0) {
      toast.error('Add at least one track to start');
      return;
    }

    const seedTrack = queue[queue.length - 1];
    const candidates = allTracks.filter(t => 
      !queue.find(q => q.id === t.id) && t.analysis_status === 'complete'
    );

    const scoredTracks = candidates
      .map(track => ({
        ...track,
        score: calculateCompatibilityScore(seedTrack, track)
      }))
      .filter(t => t.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    setQueue([...queue, ...scoredTracks]);
    toast.success(`Added ${scoredTracks.length} compatible tracks`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <audio ref={audioRefA} src={currentTrack?.audio_url} />
      <audio ref={audioRefB} src={nextTrack?.audio_url} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Auto-DJ Mode</h1>
            <p className="text-zinc-400">Intelligent mixing powered by AI</p>
          </div>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Controls */}
        {showSettings && (
          <AutoDJControls
            mixingStyle={mixingStyle}
            onMixingStyleChange={setMixingStyle}
            transitionType={transitionType}
            onTransitionTypeChange={setTransitionType}
            transitionDuration={transitionDuration}
            onTransitionDurationChange={setTransitionDuration}
          />
        )}

        {/* Transition Visualizer */}
        <TransitionVisualizer
          currentTrack={currentTrack}
          nextTrack={nextTrack}
          crossfaderPosition={crossfaderPosition}
          isTransitioning={isTransitioning}
          isPlaying={isPlaying}
          activeTransitionType={activeTransitionType}
          onPlayPause={handlePlayPause}
          onSkip={handleSkip}
        />

        {/* Queue */}
        <AutoDJQueue
          queue={queue}
          currentTrackIndex={currentTrackIndex}
          nextTrackIndex={nextTrackIndex}
          allTracks={allTracks}
          onAddToQueue={handleAddToQueue}
          onRemoveFromQueue={handleRemoveFromQueue}
          onReorderQueue={handleReorderQueue}
          onGenerateSmartQueue={handleGenerateSmartQueue}
        />
      </div>
    </div>
  );
}