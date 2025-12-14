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
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({ ...prev, [i]: 'uploading' }));

      // Extract metadata and artwork
      const metadata = await extractMetadata(file);
      
      // Upload audio file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Upload artwork if available
      let artwork_url = null;
      if (metadata.blob) {
        try {
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
      
      setUploadProgress(prev => ({ ...prev, [i]: 'analyzing' }));
      
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
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert music analyst, producer, audio engineer, and DJ with deep knowledge of music theory, production techniques, harmonic analysis, and sonic characteristics. Analyze this audio track titled "${title}".

Provide a COMPREHENSIVE DEEP ANALYSIS including:

1. GENRE CLASSIFICATION:
   - Primary genre and highly specific sub-genre
   - Be extremely specific (e.g., "melodic techno", "liquid drum & bass", "deep house", "progressive trance")

2. TECHNICAL ANALYSIS:
   - BPM (realistic range 60-200)
   - Musical key (e.g., "C Major", "A Minor")
   - Camelot notation for harmonic mixing
   - Energy level (1-10 scale)

3. ADVANCED HARMONIC ANALYSIS:
   - Harmonic progression: Describe the chord movement and harmonic journey
   - Chord progression: List the chord progression pattern (e.g., ["I", "V", "vi", "IV"])
   - Harmonic tension: Level of tension/dissonance (1-10)
   - Modal quality: Modal characteristics (e.g., "major", "minor", "dorian", "lydian")
   - Tonal center: Primary root note/tonal center
   - Harmonic movement: Type of movement (e.g., "circular", "ascending", "chromatic", "static")
   - Dynamic range: Variation in volume/intensity (1-10)

4. SONIC CHARACTERISTICS:
   - Brightness: High-frequency content and sparkle (1-10)
   - Warmth: Low-frequency richness and analog quality (1-10)
   - Depth: Spatial depth and dimension (1-10)
   - Clarity: Mix definition and separation (1-10)
   - Texture: Overall sonic texture (e.g., "smooth", "gritty", "crystalline", "analog", "digital")
   - Bass presence: Sub-bass and bass weight (1-10)
   - Stereo width: Stereo field width (1-10)
   - Transient sharpness: Attack sharpness (1-10)
   - Saturation level: Harmonic saturation/distortion (1-10)

5. PRODUCTION TECHNIQUES:
   - Compression style: Approach (e.g., "heavy", "transparent", "pumping", "glue", "light")
   - Reverb style: Reverb type (e.g., "plate", "hall", "room", "spring", "shimmer", "none")
   - Spatial depth: 3D positioning and depth (1-10)
   - Layering complexity: Sound layering complexity (1-10)
   - Production quality: Overall production quality (1-10)

6. ADVANCED RHYTHMIC ANALYSIS:
   - Rhythmic complexity: Overall rhythm complexity (1-10)
   - Syncopation: Level of syncopation (1-10)
   - Swing: Amount of swing/shuffle (1-10)
   - Groove type: Groove style (e.g., "straight", "swung", "shuffled", "syncopated", "polyrhythmic")
   - Percussion complexity: Drum pattern complexity (1-10)

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
   - Estimate timestamps for sections (intro, verse, chorus, bridge, breakdown, drop, outro)

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
    }

    setUploading(false);
    setFiles([]);
    setUploadProgress({});
    onUploadComplete?.(results);
    onOpenChange(false);
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
                {uploadProgress[index] === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                )}
                {uploadProgress[index] === 'analyzing' && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Analyzing...</span>
                  </div>
                )}
                {uploadProgress[index] === 'complete' && (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
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

        {/* Upload Button */}
        {files.length > 0 && (
          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Analyze {files.length} Track{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}