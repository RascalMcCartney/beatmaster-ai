import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2, Music2, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import { parseBlob } from 'music-metadata-browser';
import { Buffer } from 'buffer';

// Polyfill Buffer for music-metadata-browser
window.Buffer = Buffer;

export default function UploadModal({ open, onOpenChange, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  const abortControllerRef = React.useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('audio/')
    );
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type.startsWith('audio/')
    );
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractMetadata = async (file) => {
    try {
      const metadata = await parseBlob(file);
      const picture = metadata.common.picture?.[0];
      
      console.log('Extracted metadata:', {
        title: metadata.common.title,
        artist: metadata.common.artist,
        hasPicture: !!picture
      });
      
      let artworkBlob = null;
      if (picture?.data) {
        const mimeType = picture.format || 'image/jpeg';
        artworkBlob = new Blob([picture.data.buffer || picture.data], { type: mimeType });
        console.log('Created artwork blob:', artworkBlob.size, 'bytes');
      }
      
      return {
        blob: artworkBlob,
        artist: metadata.common.artist,
        album: metadata.common.album,
        title: metadata.common.title,
        duration: metadata.format.duration
      };
    } catch (error) {
      console.error('Metadata extraction error:', error);
      return {};
    }
  };

  const uploadFiles = async () => {
    setUploading(true);
    setCancelRequested(false);
    setCurrentTrackIndex(0);
    abortControllerRef.current = new AbortController();
    const results = [];

    for (let i = 0; i < files.length; i++) {
      // Check for cancellation
      if (cancelRequested || abortControllerRef.current?.signal.aborted) {
        setUploadProgress(prev => ({ ...prev, [i]: 'cancelled' }));
        break;
      }

      const file = files[i];
      setCurrentTrackIndex(i + 1);
      setUploadProgress(prev => ({ ...prev, [i]: 'uploading' }));

      try {
        // Extract metadata and artwork
        setUploadProgress(prev => ({ ...prev, [i]: { status: 'uploading', step: 'metadata' } }));
        const metadata = await extractMetadata(file);
        
        // Upload audio file
        setUploadProgress(prev => ({ ...prev, [i]: { status: 'uploading', step: 'audio' } }));
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
        // Upload artwork if available
        let artwork_url = null;
        if (metadata.blob) {
          try {
            setUploadProgress(prev => ({ ...prev, [i]: { status: 'uploading', step: 'artwork' } }));
            console.log('Uploading artwork...');
            // Convert blob to File object with proper naming
            const artworkFile = new File([metadata.blob], `artwork_${Date.now()}.jpg`, { type: metadata.blob.type });
            const artworkResult = await base44.integrations.Core.UploadFile({ file: artworkFile });
            artwork_url = artworkResult.file_url;
            console.log('Artwork uploaded:', artwork_url);
          } catch (error) {
            console.error('Artwork upload error:', error);
          }
        } else {
          console.log('No artwork found in metadata');
        }
        
        // Use metadata title if available, otherwise filename
        const title = metadata.title || file.name.replace(/\.[^/.]+$/, '');
        
        setUploadProgress(prev => ({ ...prev, [i]: { status: 'analyzing', step: 'creating' } }));
      
        // Create track with pending analysis
        const track = await base44.entities.Track.create({
          title,
          artist: metadata.artist || undefined,
          album: metadata.album || undefined,
          audio_url: file_url,
          artwork_url: artwork_url || undefined,
          duration: metadata.duration || undefined,
          analysis_status: 'analyzing'
        });

        // Analyze with AI - Enhanced Deep Analysis
        setUploadProgress(prev => ({ ...prev, [i]: { status: 'analyzing', step: 'ai' } }));
        const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert music analyst, producer, audio engineer, and DJ with deep knowledge of music theory, production techniques, harmonic analysis, and sonic characteristics. Analyze this audio track titled "${title}" by ${metadata.artist || 'Unknown Artist'}.

Provide a COMPREHENSIVE DEEP ANALYSIS for advanced filtering and recommendations:

1. GENRE CLASSIFICATION:
   - Primary genre and highly specific sub-genre (e.g., "melodic techno", "liquid drum & bass", "progressive house")

2. TECHNICAL METRICS:
   - BPM: Accurate tempo (realistic range 60-200)
   - Musical key: Full key name (e.g., "C Major", "A Minor", "F♯ Minor")
   - Camelot notation: For harmonic DJ mixing (e.g., "8A", "5B")
   - Energy level: Overall intensity (1-10 scale)

3. DETAILED HARMONIC ANALYSIS (for key compatibility & harmonic mixing):
   - Harmonic progression: Detailed description of chord movement and harmonic journey (e.g., "Circular progression creating tension and release, building through minor chords into major resolution")
   - Chord progression: Specific chord sequence using Roman numerals (e.g., ["I", "V", "vi", "IV"] or ["i", "VI", "III", "VII"])
   - Harmonic tension: Amount of dissonance/tension throughout (1-10, where 1=consonant/stable, 10=highly dissonant/tense)
   - Modal quality: Exact modal characteristics (e.g., "major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian")
   - Tonal center: Primary root note and stability (e.g., "Strong C root", "Floating between D and E", "Ambiguous tonal center")
   - Harmonic movement: Progression type (e.g., "circular", "ascending", "descending", "chromatic", "static", "modal interchange", "parallel")

4. SONIC CHARACTERISTICS (for sound matching & filtering):
   - Brightness: High-frequency presence and air (1-10, where 1=dark/muffled/dull, 10=bright/sparkly/airy)
   - Warmth: Low-mid richness and analog character (1-10, where 1=cold/thin/digital, 10=warm/full/analog)
   - Depth: 3D spatial dimension and layering (1-10, where 1=flat/2D/dry, 10=deep/3D/spacious)
   - Clarity: Mix separation and definition (1-10, where 1=muddy/blurred/messy, 10=crystal clear/defined/transparent)
   - Texture: Overall sonic feel (choose: "smooth", "gritty", "crystalline", "analog", "digital", "organic", "synthetic", "polished", "raw", "ethereal")
   - Bass presence: Sub and bass weight (1-10, where 1=minimal bass/light, 10=bass-heavy/sub-dominant)
   - Stereo width: Stereo field spread (1-10, where 1=mono/narrow/centered, 10=wide/expansive/panoramic)
   - Transient sharpness: Percussive attack clarity (1-10, where 1=soft/rounded/smooth, 10=sharp/punchy/aggressive)
   - Saturation level: Harmonic richness/distortion (1-10, where 1=clean/pristine, 10=heavily saturated/overdriven)

5. PRODUCTION TECHNIQUES (for production style matching):
   - Compression style: Dynamic control approach (choose one: "heavy", "transparent", "pumping", "glue", "light", "sidechain", "parallel", "multiband", "none")
   - Reverb style: Spatial effect type (choose one: "plate", "hall", "room", "spring", "shimmer", "convolution", "digital", "gated", "reverse", "none")
   - Spatial depth: Front-to-back positioning (1-10, where 1=upfront/dry/intimate, 10=distant/wet/spacious)
   - Layering complexity: Number and intricacy of sound layers (1-10, where 1=minimal layers/sparse, 10=highly layered/dense)
   - Production quality: Technical execution and polish (1-10, where 1=lo-fi/amateur/rough, 10=professional/mastered/polished)

6. RHYTHMIC ANALYSIS (for groove & beat matching):
   - Rhythmic complexity: Pattern intricacy (1-10, where 1=simple/repetitive/basic, 10=complex/polyrhythmic/intricate)
   - Syncopation: Off-beat emphasis level (1-10, where 1=on-beat/quantized/straight, 10=highly syncopated/off-grid)
   - Swing: Shuffle/groove amount (1-10, where 1=straight/quantized/rigid, 10=heavily swung/loose/groovy)
   - Groove type: Rhythmic feel (choose one: "straight", "swung", "shuffled", "syncopated", "polyrhythmic", "triplet", "dotted", "half-time", "double-time")
   - Percussion complexity: Drum programming detail (1-10, where 1=minimal/simple/basic, 10=intricate/layered/complex)

7. INSTRUMENTATION ANALYSIS:
   - List all prominent instruments/sounds (e.g., ["synth pad", "808 bass", "clap", "hi-hats", "vocal chops", "piano"])
   - Instrumentation density: How layered/dense the production is (1-10)

8. MOOD & ATMOSPHERE:
   - Primary mood (e.g., "euphoric", "melancholic", "energetic")
   - Mood tags: Array of mood descriptors (e.g., ["uplifting", "emotional", "dark", "dreamy"])
   - Emotional intensity: How emotionally intense (1-10)
   - Atmosphere: Overall feel (e.g., "spacious", "intimate", "aggressive", "ethereal")

9. VOCAL ANALYSIS:
   - Track type: "instrumental", "vocal", or "mixed"
   - Vocal intensity (1-10)

10. STRUCTURAL ANALYSIS:
   - Buildup intensity (1-10): How intense are the buildups/crescendos
   - Drop impact (1-10): Impact of drops/climaxes
   - Structure: Estimate timestamps in SECONDS for track sections. Based on the track duration (${metadata.duration ? metadata.duration.toFixed(0) : 'unknown'} seconds), provide realistic start and end times for:
     * intro: Single object with start/end times
     * verse: Array of verse sections with start/end times
     * chorus: Array of chorus sections with start/end times  
     * bridge: Single object with start/end times (if applicable)
     * breakdown: Array of breakdown sections with start/end times (if applicable)
     * drop: Array of drop sections with start/end times (if applicable)
     * outro: Single object with start/end times
   
   IMPORTANT: 
   - All times must be in SECONDS (not minutes)
   - Times must be realistic based on the track's ${metadata.duration ? metadata.duration.toFixed(0) : 'unknown'} second duration
   - Sections should not overlap
   - Not all tracks have all sections (especially bridge, breakdown, drop)
   - Typical track structure timing:
     * Intro: 0-15s or 0-30s
     * Verse: 30-60s sections
     * Chorus: 30-60s sections  
     * Bridge: 15-30s (if present)
     * Breakdown: 15-45s (electronic music)
     * Drop: 30-60s (electronic music)
     * Outro: Last 15-30s of track

11. DJ MIXING ANALYSIS:
   - Danceability (1-10)
   - Mixability (1-10)
   - Melodic complexity (1-10)
   - DJ mixing notes: Detailed mixing tips, best entry/exit points, compatible BPM ranges, harmonic mixing suggestions

Base analysis on the title "${title}", artist patterns, genre conventions, and music production standards. Be detailed, realistic, and technically precise.`,
        response_json_schema: {
          type: "object",
          properties: {
            bpm: { type: "number" },
            key: { type: "string" },
            camelot: { type: "string" },
            energy: { type: "number" },
            genre: { type: "string" },
            sub_genre: { type: "string" },
            mood: { type: "string" },
            mood_tags: { 
              type: "array",
              items: { type: "string" }
            },
            emotional_intensity: { type: "number" },
            track_type: { type: "string", enum: ["instrumental", "vocal", "mixed"] },
            vocal_intensity: { type: "number" },
            danceability: { type: "number" },
            mixability: { type: "number" },
            rhythmic_complexity: { type: "number" },
            melodic_complexity: { type: "number" },
            harmonic_progression: { type: "string" },
            chord_progression: {
              type: "array",
              items: { type: "string" }
            },
            instrumentation: {
              type: "array",
              items: { type: "string" }
            },
            instrumentation_density: { type: "number" },
            production_quality: { type: "number" },
            atmosphere: { type: "string" },
            buildup_intensity: { type: "number" },
            drop_impact: { type: "number" },
            dynamic_range: { type: "number" },
            mix_notes: { type: "string" },
            brightness: { type: "number" },
            warmth: { type: "number" },
            depth: { type: "number" },
            clarity: { type: "number" },
            texture: { type: "string" },
            syncopation: { type: "number" },
            swing: { type: "number" },
            groove_type: { type: "string" },
            percussion_complexity: { type: "number" },
            compression_style: { type: "string" },
            reverb_style: { type: "string" },
            spatial_depth: { type: "number" },
            layering_complexity: { type: "number" },
            harmonic_tension: { type: "number" },
            modal_quality: { type: "string" },
            tonal_center: { type: "string" },
            harmonic_movement: { type: "string" },
            bass_presence: { type: "number" },
            stereo_width: { type: "number" },
            transient_sharpness: { type: "number" },
            saturation_level: { type: "number" },
            structure: {
              type: "object",
              properties: {
                intro: { 
                  type: "object",
                  properties: {
                    start: { type: "number" },
                    end: { type: "number" }
                  }
                },
                verse: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      start: { type: "number" },
                      end: { type: "number" }
                    }
                  }
                },
                chorus: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      start: { type: "number" },
                      end: { type: "number" }
                    }
                  }
                },
                bridge: { 
                  type: "object",
                  properties: {
                    start: { type: "number" },
                    end: { type: "number" }
                  }
                },
                breakdown: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      start: { type: "number" },
                      end: { type: "number" }
                    }
                  }
                },
                drop: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      start: { type: "number" },
                      end: { type: "number" }
                    }
                  }
                },
                outro: { 
                  type: "object",
                  properties: {
                    start: { type: "number" },
                    end: { type: "number" }
                  }
                }
              }
            }
          }
        }
      });

        // Update track with analysis
        await base44.entities.Track.update(track.id, {
          ...analysis,
          analysis_status: 'complete'
        });

        setUploadProgress(prev => ({ ...prev, [i]: 'complete' }));
        results.push({ ...track, ...analysis });
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => ({ ...prev, [i]: 'error' }));
      }
    }

    setUploading(false);
    setCurrentTrackIndex(0);
    
    if (!cancelRequested && !abortControllerRef.current?.signal.aborted) {
      setFiles([]);
      setUploadProgress({});
      onUploadComplete?.(results);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setCancelRequested(true);
    abortControllerRef.current?.abort();
    setUploading(false);
    setCurrentTrackIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Upload Tracks</DialogTitle>
        </DialogHeader>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center transition-all",
            dragOver 
              ? "border-violet-500 bg-violet-500/10" 
              : "border-zinc-700 hover:border-zinc-600"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="text-zinc-300 mb-2">Drag and drop audio files here</p>
          <p className="text-zinc-500 text-sm mb-4">or</p>
          <label>
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="outline" className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800" asChild>
              <span>Browse Files</span>
            </Button>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {uploadProgress[index]?.status === 'uploading' && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    <span className="text-xs text-violet-400">
                      {uploadProgress[index]?.step === 'metadata' && 'Reading...'}
                      {uploadProgress[index]?.step === 'audio' && 'Uploading...'}
                      {uploadProgress[index]?.step === 'artwork' && 'Artwork...'}
                    </span>
                  </div>
                )}
                {uploadProgress[index]?.status === 'analyzing' && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="text-xs text-amber-400">
                      {uploadProgress[index]?.step === 'creating' && 'Creating...'}
                      {uploadProgress[index]?.step === 'ai' && 'AI Analysis...'}
                    </span>
                  </div>
                )}
                {uploadProgress[index] === 'complete' && (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
                {uploadProgress[index] === 'error' && (
                  <X className="w-5 h-5 text-red-400" />
                )}
                {uploadProgress[index] === 'cancelled' && (
                  <span className="text-xs text-zinc-500">Cancelled</span>
                )}
                {!uploadProgress[index] && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Overall Progress */}
        {uploading && files.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Overall Progress</span>
              <span className="text-white font-medium">{currentTrackIndex} of {files.length}</span>
            </div>
            <Progress 
              value={(currentTrackIndex / files.length) * 100} 
              className="h-2 bg-zinc-800"
            />
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={uploadFiles}
              disabled={uploading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing {currentTrackIndex}/{files.length}...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Analyze {files.length} Track{files.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
            {uploading && (
              <Button
                onClick={handleCancel}
                variant="outline"
                className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}