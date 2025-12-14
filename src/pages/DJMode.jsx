import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Deck from '@/components/dj/Deck';
import Mixer from '@/components/dj/Mixer';
import TrackBrowser from '@/components/dj/TrackBrowser';
import HarmonicMixingIndicator from '@/components/dj/HarmonicMixingIndicator';
import BeatmatchingVisualization from '@/components/dj/BeatmatchingVisualization';
import MusicVisualizer from '@/components/dj/MusicVisualizer';
import MIDIMappingModal from '@/components/midi/MIDIMappingModal';
import { useMIDI } from '@/components/midi/useMIDI';
import DJAssistant from '@/components/ai/DJAssistant';
import { Button } from "@/components/ui/button";
import { Menu, X, Circle, Square, Usb, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DJMode() {
  const [browserOpen, setBrowserOpen] = useState(false);
  const [activeDeck, setActiveDeck] = useState(null);
  const [midiMappingOpen, setMidiMappingOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  
  // Deck states
  const [deckATrack, setDeckATrack] = useState(null);
  const [deckBTrack, setDeckBTrack] = useState(null);
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [deckATime, setDeckATime] = useState(0);
  const [deckBTime, setDeckBTime] = useState(0);
  const [deckATempo, setDeckATempo] = useState(0);
  const [deckBTempo, setDeckBTempo] = useState(0);
  
  // Mixer states
  const [crossfader, setCrossfader] = useState(50);
  const [crossfaderCurve, setCrossfaderCurve] = useState('smooth');
  const [deckAVolume, setDeckAVolume] = useState(80);
  const [deckBVolume, setDeckBVolume] = useState(80);
  const [masterVolume, setMasterVolume] = useState(80);
  
  // EQ states
  const [deckAEQ, setDeckAEQ] = useState({ high: 50, mid: 50, low: 50 });
  const [deckBEQ, setDeckBEQ] = useState({ high: 50, mid: 50, low: 50 });
  const [masterEQ, setMasterEQ] = useState({ high: 50, mid: 50, low: 50 });
  
  // Headphone cue states
  const [headphoneCueA, setHeadphoneCueA] = useState(false);
  const [headphoneCueB, setHeadphoneCueB] = useState(false);
  const [headphoneVolume, setHeadphoneVolume] = useState(80);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordedTracks, setRecordedTracks] = useState([]);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  // Audio refs and context
  const audioRefA = useRef(null);
  const audioRefB = useRef(null);
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef({});
  const audioSetupDoneRef = useRef(false);

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-updated_date'),
  });

  const queryClient = useQueryClient();

  // MIDI support
  const {
    isSupported: midiSupported,
    devices: midiDevices,
    mappings: midiMappings,
    learningControl,
    startLearning,
    stopLearning,
    onControl,
    removeMapping,
    clearAllMappings
  } = useMIDI();

  const saveRecordingMutation = useMutation({
    mutationFn: async (recordingData) => {
      return await base44.entities.Recording.create(recordingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast.success('Recording saved successfully');
    },
  });

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Setup audio routing ONCE - only create nodes once
  useEffect(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext || !audioRefA.current || !audioRefB.current || audioSetupDoneRef.current) return;

    // Set audio element properties
    audioRefA.current.volume = 1.0;
    audioRefB.current.volume = 1.0;

    // Resume audio context on user interaction
    const resumeAudio = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    };
    document.addEventListener('click', resumeAudio, { once: true });

    // Create audio nodes for Deck A
    const sourceA = audioContext.createMediaElementSource(audioRefA.current);
    const gainA = audioContext.createGain();
    const eqHighA = audioContext.createBiquadFilter();
    const eqMidA = audioContext.createBiquadFilter();
    const eqLowA = audioContext.createBiquadFilter();
    
    eqHighA.type = 'highshelf';
    eqHighA.frequency.value = 8000;
    eqMidA.type = 'peaking';
    eqMidA.frequency.value = 1000;
    eqMidA.Q.value = 0.5;
    eqLowA.type = 'lowshelf';
    eqLowA.frequency.value = 250;

    // Create audio nodes for Deck B
    const sourceB = audioContext.createMediaElementSource(audioRefB.current);
    const gainB = audioContext.createGain();
    const eqHighB = audioContext.createBiquadFilter();
    const eqMidB = audioContext.createBiquadFilter();
    const eqLowB = audioContext.createBiquadFilter();
    
    eqHighB.type = 'highshelf';
    eqHighB.frequency.value = 8000;
    eqMidB.type = 'peaking';
    eqMidB.frequency.value = 1000;
    eqMidB.Q.value = 0.5;
    eqLowB.type = 'lowshelf';
    eqLowB.frequency.value = 250;

    // Master EQ
    const masterGain = audioContext.createGain();
    const masterEqHigh = audioContext.createBiquadFilter();
    const masterEqMid = audioContext.createBiquadFilter();
    const masterEqLow = audioContext.createBiquadFilter();
    
    masterEqHigh.type = 'highshelf';
    masterEqHigh.frequency.value = 8000;
    masterEqMid.type = 'peaking';
    masterEqMid.frequency.value = 1000;
    masterEqMid.Q.value = 0.5;
    masterEqLow.type = 'lowshelf';
    masterEqLow.frequency.value = 250;

    // Headphone cue nodes
    const headphoneGainA = audioContext.createGain();
    const headphoneGainB = audioContext.createGain();
    const headphoneMerger = audioContext.createChannelMerger(2);

    // Connect Deck A: source -> EQ -> gain -> master
    sourceA.connect(eqHighA).connect(eqMidA).connect(eqLowA).connect(gainA);
    gainA.connect(masterGain);
    
    // Connect Deck B: source -> EQ -> gain -> master
    sourceB.connect(eqHighB).connect(eqMidB).connect(eqLowB).connect(gainB);
    gainB.connect(masterGain);

    // Connect master: master gain -> master EQ -> destination
    masterGain.connect(masterEqHigh).connect(masterEqMid).connect(masterEqLow).connect(audioContext.destination);

    // Headphone cue routing (separate from master)
    eqLowA.connect(headphoneGainA).connect(headphoneMerger, 0, 0).connect(audioContext.destination);
    eqLowB.connect(headphoneGainB).connect(headphoneMerger, 0, 1).connect(audioContext.destination);

    // Set initial gain values
    gainA.gain.value = 0.8;
    gainB.gain.value = 0.8;
    masterGain.gain.value = 0.8;
    headphoneGainA.gain.value = 0;
    headphoneGainB.gain.value = 0;

    audioNodesRef.current = {
      sourceA, sourceB,
      gainA, gainB, masterGain,
      eqHighA, eqMidA, eqLowA,
      eqHighB, eqMidB, eqLowB,
      masterEqHigh, masterEqMid, masterEqLow,
      headphoneGainA, headphoneGainB
    };

    audioSetupDoneRef.current = true;
  }, []);

  // Apply volume and crossfader with curves
  useEffect(() => {
    const nodes = audioNodesRef.current;
    if (!nodes.gainA || !nodes.gainB || !nodes.masterGain) return;

    let fadeA, fadeB;
    if (crossfaderCurve === 'smooth') {
      fadeA = Math.cos((crossfader / 100) * 0.5 * Math.PI);
      fadeB = Math.cos(((100 - crossfader) / 100) * 0.5 * Math.PI);
    } else if (crossfaderCurve === 'fast') {
      fadeA = crossfader < 50 ? 1 : (100 - crossfader) / 50;
      fadeB = crossfader > 50 ? 1 : crossfader / 50;
    } else if (crossfaderCurve === 'sharp') {
      fadeA = crossfader < 5 ? 1 : 0;
      fadeB = crossfader > 95 ? 1 : 0;
    } else {
      fadeA = (100 - crossfader) / 100;
      fadeB = crossfader / 100;
    }
    
    nodes.gainA.gain.value = (deckAVolume / 100) * fadeA;
    nodes.gainB.gain.value = (deckBVolume / 100) * fadeB;
    nodes.masterGain.gain.value = masterVolume / 100;
  }, [crossfader, crossfaderCurve, deckAVolume, deckBVolume, masterVolume]);

  // Apply EQ for Deck A
  useEffect(() => {
    const nodes = audioNodesRef.current;
    if (!nodes.eqHighA) return;

    const highGain = (deckAEQ.high - 50) / 5;
    const midGain = (deckAEQ.mid - 50) / 5;
    const lowGain = (deckAEQ.low - 50) / 5;

    nodes.eqHighA.gain.value = highGain;
    nodes.eqMidA.gain.value = midGain;
    nodes.eqLowA.gain.value = lowGain;
  }, [deckAEQ]);

  // Apply EQ for Deck B
  useEffect(() => {
    const nodes = audioNodesRef.current;
    if (!nodes.eqHighB) return;

    const highGain = (deckBEQ.high - 50) / 5;
    const midGain = (deckBEQ.mid - 50) / 5;
    const lowGain = (deckBEQ.low - 50) / 5;

    nodes.eqHighB.gain.value = highGain;
    nodes.eqMidB.gain.value = midGain;
    nodes.eqLowB.gain.value = lowGain;
  }, [deckBEQ]);

  // Apply Master EQ
  useEffect(() => {
    const nodes = audioNodesRef.current;
    if (!nodes.masterEqHigh) return;

    const highGain = (masterEQ.high - 50) / 5;
    const midGain = (masterEQ.mid - 50) / 5;
    const lowGain = (masterEQ.low - 50) / 5;

    nodes.masterEqHigh.gain.value = highGain;
    nodes.masterEqMid.gain.value = midGain;
    nodes.masterEqLow.gain.value = lowGain;
  }, [masterEQ]);

  // Apply headphone cue
  useEffect(() => {
    const nodes = audioNodesRef.current;
    if (!nodes.headphoneGainA || !nodes.headphoneGainB) return;

    const headphoneVol = headphoneVolume / 100;
    nodes.headphoneGainA.gain.value = headphoneCueA ? headphoneVol : 0;
    nodes.headphoneGainB.gain.value = headphoneCueB ? headphoneVol : 0;
  }, [headphoneCueA, headphoneCueB, headphoneVolume]);

  const handleTrackSelect = (track) => {
    if (activeDeck === 'A') {
      setDeckATrack(track);
      setDeckAPlaying(false);
    } else if (activeDeck === 'B') {
      setDeckBTrack(track);
      setDeckBPlaying(false);
    }
    setBrowserOpen(false);
    setActiveDeck(null);
  };

  const handlePlayPause = (deck) => {
    // Resume audio context on user interaction
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('AudioContext resumed');
      });
    }
    
    console.log(`Play/Pause ${deck}, current state:`, deck === 'A' ? deckAPlaying : deckBPlaying);
    console.log('Audio element:', deck === 'A' ? audioRefA.current : audioRefB.current);
    console.log('Audio nodes ready:', Object.keys(audioNodesRef.current).length > 0);
    
    if (deck === 'A') {
      setDeckAPlaying(!deckAPlaying);
    } else {
      setDeckBPlaying(!deckBPlaying);
    }
  };

  const handleLoadTrack = (deck) => {
    setActiveDeck(deck);
    setBrowserOpen(true);
  };

  // Setup MIDI control mappings
  useEffect(() => {
    const cleanups = [];

    // Deck A controls
    cleanups.push(onControl('deckA.play', () => handlePlayPause('A')));
    cleanups.push(onControl('deckA.tempo', (value) => setDeckATempo((value - 0.5) * 100)));
    cleanups.push(onControl('deckA.volume', (value) => setDeckAVolume(value * 100)));
    cleanups.push(onControl('deckA.eq.high', (value) => setDeckAEQ(eq => ({ ...eq, high: value * 100 }))));
    cleanups.push(onControl('deckA.eq.mid', (value) => setDeckAEQ(eq => ({ ...eq, mid: value * 100 }))));
    cleanups.push(onControl('deckA.eq.low', (value) => setDeckAEQ(eq => ({ ...eq, low: value * 100 }))));

    // Deck B controls
    cleanups.push(onControl('deckB.play', () => handlePlayPause('B')));
    cleanups.push(onControl('deckB.tempo', (value) => setDeckBTempo((value - 0.5) * 100)));
    cleanups.push(onControl('deckB.volume', (value) => setDeckBVolume(value * 100)));
    cleanups.push(onControl('deckB.eq.high', (value) => setDeckBEQ(eq => ({ ...eq, high: value * 100 }))));
    cleanups.push(onControl('deckB.eq.mid', (value) => setDeckBEQ(eq => ({ ...eq, mid: value * 100 }))));
    cleanups.push(onControl('deckB.eq.low', (value) => setDeckBEQ(eq => ({ ...eq, low: value * 100 }))));

    // Mixer controls
    cleanups.push(onControl('mixer.crossfader', (value) => setCrossfader(value * 100)));
    cleanups.push(onControl('mixer.master', (value) => setMasterVolume(value * 100)));
    cleanups.push(onControl('mixer.headphone', (value) => setHeadphoneVolume(value * 100)));
    cleanups.push(onControl('mixer.cueA', () => setHeadphoneCueA(v => !v)));
    cleanups.push(onControl('mixer.cueB', () => setHeadphoneCueB(v => !v)));

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [onControl]);

  // Track when tracks are played during recording
  useEffect(() => {
    if (!isRecording) return;

    const track = deckAPlaying ? deckATrack : deckBPlaying ? deckBTrack : null;
    if (!track) return;

    const currentTime = Date.now();
    const timeSinceStart = (currentTime - recordingStartTime) / 1000;

    setRecordedTracks(prev => {
      const lastTrack = prev[prev.length - 1];
      if (lastTrack?.track_id === track.id) return prev;
      
      return [...prev, {
        track_id: track.id,
        track_title: track.title,
        timestamp: timeSinceStart
      }];
    });
  }, [deckATrack, deckBTrack, deckAPlaying, deckBPlaying, isRecording, recordingStartTime]);

  const startRecording = async () => {
    const audioContext = audioContextRef.current;
    const masterOutput = audioNodesRef.current.masterEqLow;
    
    if (!audioContext || !masterOutput) {
      toast.error('Audio system not ready');
      return;
    }

    try {
      const destination = audioContext.createMediaStreamDestination();
      masterOutput.connect(destination);

      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const duration = (Date.now() - recordingStartTime) / 1000;
        
        const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
        
        await saveRecordingMutation.mutateAsync({
          title: `DJ Set ${new Date().toLocaleDateString()}`,
          audio_url: file_url,
          duration: Math.floor(duration),
          tracks_played: recordedTracks,
          recording_date: new Date().toISOString()
        });

        setRecordedTracks([]);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped, saving...');
    }
  };

  return (
    <div className="h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            DJ Performance Mode
          </h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setAssistantOpen(!assistantOpen)}
              variant="outline"
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
            {midiSupported && (
              <Button
                onClick={() => setMidiMappingOpen(true)}
                variant="outline"
                className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Usb className="w-4 h-4 mr-2" />
                MIDI
                {midiDevices.length > 0 && (
                  <span className="ml-2 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </Button>
            )}
            {isRecording ? (
              <Button
                onClick={stopRecording}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                <Square className="w-4 h-4 mr-2 fill-current" />
                Stop Recording
              </Button>
            ) : (
              <Button
                onClick={startRecording}
                variant="outline"
                className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Circle className="w-4 h-4 mr-2 text-red-500 fill-current" />
                Record
              </Button>
            )}
            <Button
              onClick={() => setBrowserOpen(!browserOpen)}
              variant="outline"
              className="bg-violet-600 hover:bg-violet-700 text-white border-0"
            >
              {browserOpen ? <X className="w-4 h-4 mr-2" /> : <Menu className="w-4 h-4 mr-2" />}
              Track Browser
            </Button>
          </div>
        </div>
        
        {/* Harmonic Mixing Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <HarmonicMixingIndicator trackA={deckATrack} trackB={deckBTrack} />
          <BeatmatchingVisualization
            deckATrack={deckATrack}
            deckBTrack={deckBTrack}
            deckAPlaying={deckAPlaying}
            deckBPlaying={deckBPlaying}
            deckATime={deckATime}
            deckBTime={deckBTime}
            deckATempo={deckATempo}
            deckBTempo={deckBTempo}
          />
          
          {/* Music Visualizer */}
          <div className="h-48">
            <MusicVisualizer
              audioContext={audioContextRef.current}
              sourceNodeA={audioNodesRef.current.sourceA}
              sourceNodeB={audioNodesRef.current.sourceB}
              isPlaying={deckAPlaying || deckBPlaying}
              deckATrack={deckATrack}
              deckBTrack={deckBTrack}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Main DJ Interface */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${browserOpen ? 'mr-96' : assistantOpen ? 'mr-96' : ''} min-h-0`}>
          {/* Decks */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Deck A */}
            <Deck
              deck="A"
              track={deckATrack}
              isPlaying={deckAPlaying}
              onPlayPause={() => handlePlayPause('A')}
              audioRef={audioRefA}
              audioContext={audioContextRef.current}
              onLoadTrack={() => handleLoadTrack('A')}
              volume={deckAVolume}
              syncTarget={deckBTrack}
              onTimeUpdate={(time) => setDeckATime(time)}
              onTempoChange={(tempo) => setDeckATempo(tempo)}
            />

            {/* Deck B */}
            <Deck
              deck="B"
              track={deckBTrack}
              isPlaying={deckBPlaying}
              onPlayPause={() => handlePlayPause('B')}
              audioRef={audioRefB}
              audioContext={audioContextRef.current}
              onLoadTrack={() => handleLoadTrack('B')}
              volume={deckBVolume}
              syncTarget={deckATrack}
              onTimeUpdate={(time) => setDeckBTime(time)}
              onTempoChange={(tempo) => setDeckBTempo(tempo)}
            />
          </div>

          {/* Mixer */}
          <Mixer
            crossfader={crossfader}
            onCrossfaderChange={setCrossfader}
            crossfaderCurve={crossfaderCurve}
            onCrossfaderCurveChange={setCrossfaderCurve}
            deckAVolume={deckAVolume}
            deckBVolume={deckBVolume}
            masterVolume={masterVolume}
            onDeckAVolumeChange={setDeckAVolume}
            onDeckBVolumeChange={setDeckBVolume}
            onMasterVolumeChange={setMasterVolume}
            deckAEQ={deckAEQ}
            deckBEQ={deckBEQ}
            masterEQ={masterEQ}
            onDeckAEQChange={setDeckAEQ}
            onDeckBEQChange={setDeckBEQ}
            onMasterEQChange={setMasterEQ}
            headphoneCueA={headphoneCueA}
            headphoneCueB={headphoneCueB}
            onHeadphoneCueAChange={setHeadphoneCueA}
            onHeadphoneCueBChange={setHeadphoneCueB}
            headphoneVolume={headphoneVolume}
            onHeadphoneVolumeChange={setHeadphoneVolume}
            deckATrack={deckATrack}
            deckBTrack={deckBTrack}
          />
        </div>

        {/* Track Browser Sidebar */}
        {browserOpen && (
          <TrackBrowser
            tracks={tracks}
            onSelect={handleTrackSelect}
            onClose={() => setBrowserOpen(false)}
            activeDeck={activeDeck}
          />
        )}

        {/* AI Assistant Sidebar */}
        {assistantOpen && (
          <div className="w-96 h-full bg-zinc-950 border-l border-zinc-800 overflow-y-auto p-4">
            <DJAssistant
              currentTrack={deckAPlaying ? deckATrack : deckBPlaying ? deckBTrack : null}
              allTracks={tracks}
              currentMood={null}
              onTrackSelect={(track) => {
                if (!deckATrack || !deckAPlaying) {
                  handleTrackSelect(track);
                  setActiveDeck('A');
                } else if (!deckBTrack || !deckBPlaying) {
                  handleTrackSelect(track);
                  setActiveDeck('B');
                }
              }}
              onApplyEQ={(eq) => {
                if (deckAPlaying) setDeckAEQ(eq);
                else if (deckBPlaying) setDeckBEQ(eq);
              }}
              onApplyEffect={(effect) => {
                toast.info('Effect suggestions are informational only');
              }}
            />
          </div>
        )}
      </div>

      {/* MIDI Mapping Modal */}
      <MIDIMappingModal
        open={midiMappingOpen}
        onOpenChange={setMidiMappingOpen}
        devices={midiDevices}
        mappings={midiMappings}
        learningControl={learningControl}
        onStartLearning={startLearning}
        onStopLearning={stopLearning}
        onRemoveMapping={removeMapping}
        onClearAll={clearAllMappings}
      />
    </div>
  );
}