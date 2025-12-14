import React, { useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

export default function DeckWaveform({ 
  currentTime, 
  duration, 
  bpm,
  structure,
  onSeek,
  cuePoints = [],
  loopStart,
  loopEnd,
  deckColor = 'blue'
}) {
  const canvasRef = useRef(null);
  const [hoveredTime, setHoveredTime] = React.useState(null);

  const colors = {
    blue: {
      played: 'rgb(59, 130, 246)',
      upcoming: 'rgb(71, 85, 105)',
      beatGrid: 'rgba(59, 130, 246, 0.3)',
      barGrid: 'rgba(59, 130, 246, 0.6)',
      playhead: 'rgb(59, 130, 246)',
      cue: 'rgb(251, 191, 36)',
      loop: 'rgba(34, 197, 94, 0.3)'
    },
    fuchsia: {
      played: 'rgb(217, 70, 239)',
      upcoming: 'rgb(71, 85, 105)',
      beatGrid: 'rgba(217, 70, 239, 0.3)',
      barGrid: 'rgba(217, 70, 239, 0.6)',
      playhead: 'rgb(217, 70, 239)',
      cue: 'rgb(251, 191, 36)',
      loop: 'rgba(34, 197, 94, 0.3)'
    }
  };

  const color = colors[deckColor];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Generate waveform data
    const waveformData = Array.from({ length: 200 }, (_, i) => {
      const phase = (i / 200) * Math.PI * 8;
      return Math.sin(phase) * 0.7 + Math.random() * 0.3;
    });

    // Draw waveform
    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    waveformData.forEach((amplitude, i) => {
      const x = i * barWidth;
      const barHeight = Math.abs(amplitude) * (height * 0.8);
      const y = (height - barHeight) / 2;
      
      const isPlayed = i / waveformData.length <= progress;
      ctx.fillStyle = isPlayed ? color.played : color.upcoming;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw enhanced beat grid with bar numbers
    if (bpm && duration > 0) {
      const beatInterval = 60 / bpm;
      const numBeats = Math.floor(duration / beatInterval);
      const beatsPerBar = 4;
      
      for (let i = 0; i <= numBeats; i++) {
        const beatTime = i * beatInterval;
        const x = (beatTime / duration) * width;
        const isBar = i % beatsPerBar === 0;
        const barNumber = Math.floor(i / beatsPerBar) + 1;
        
        // Draw beat line
        ctx.strokeStyle = isBar ? color.barGrid : color.beatGrid;
        ctx.lineWidth = isBar ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Draw bar number every 4 bars
        if (isBar && barNumber % 4 === 1) {
          ctx.fillStyle = color.barGrid;
          ctx.font = 'bold 10px monospace';
          ctx.fillText(barNumber.toString(), x + 2, 12);
        }
      }
    }

    // Draw loop region
    if (loopStart !== null && loopEnd !== null && duration > 0) {
      const startX = (loopStart / duration) * width;
      const endX = (loopEnd / duration) * width;
      ctx.fillStyle = color.loop;
      ctx.fillRect(startX, 0, endX - startX, height);
    }

    // Draw cue points
    cuePoints.forEach(cue => {
      if (duration > 0) {
        const x = (cue.time / duration) * width;
        ctx.fillStyle = color.cue;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 4, 8);
        ctx.lineTo(x + 4, 8);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw playhead with glow
    if (duration > 0) {
      const playheadX = progress * width;
      
      // Glow effect
      ctx.shadowColor = color.playhead;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowBlur = 0;

      // Playhead triangles
      ctx.fillStyle = '#ffffff';
      // Top triangle
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX - 6, 10);
      ctx.lineTo(playheadX + 6, 10);
      ctx.closePath();
      ctx.fill();
      
      // Bottom triangle
      ctx.beginPath();
      ctx.moveTo(playheadX, height);
      ctx.lineTo(playheadX - 6, height - 10);
      ctx.lineTo(playheadX + 6, height - 10);
      ctx.closePath();
      ctx.fill();
    }

    // Draw structure sections
    if (structure && duration > 0) {
      const sections = [
        { ...structure.intro, color: 'rgba(59, 130, 246, 0.2)', label: 'INTRO' },
        ...(structure.verse || []).map((v, i) => ({ ...v, color: 'rgba(139, 92, 246, 0.2)', label: `V${i+1}` })),
        ...(structure.chorus || []).map((c, i) => ({ ...c, color: 'rgba(236, 72, 153, 0.2)', label: `C${i+1}` })),
        ...(structure.drop || []).map((d, i) => ({ ...d, color: 'rgba(239, 68, 68, 0.2)', label: `DROP` })),
        { ...structure.outro, color: 'rgba(34, 197, 94, 0.2)', label: 'OUTRO' },
      ].filter(s => s.start !== undefined);

      sections.forEach(section => {
        const startX = (section.start / duration) * width;
        const endX = (section.end / duration) * width;
        ctx.fillStyle = section.color;
        ctx.fillRect(startX, 0, endX - startX, height);
        
        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(section.label, startX + 4, 12);
      });
    }
  }, [currentTime, duration, bpm, structure, cuePoints, loopStart, loopEnd, deckColor]);

  const handleClick = (e) => {
    if (!duration) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickRatio = x / rect.width;
    const newTime = clickRatio * duration;
    onSeek?.([newTime]);
  };

  const handleMouseMove = (e) => {
    if (!duration) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    setHoveredTime(time);
  };

  const handleMouseLeave = () => {
    setHoveredTime(null);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full rounded-lg bg-zinc-950 cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Time tooltip on hover */}
      {hoveredTime !== null && (
        <div 
          className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs font-mono px-3 py-1.5 rounded-md pointer-events-none border border-zinc-700"
        >
          {formatTime(hoveredTime)}
        </div>
      )}
    </div>
  );
}