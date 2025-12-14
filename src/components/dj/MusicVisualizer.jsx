import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Eye, EyeOff, Palette, Settings2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const THEMES = {
  neon: {
    name: 'Neon',
    colors: ['#ff00ff', '#00ffff', '#ff0080', '#0080ff', '#ffff00'],
    bg: '#000000'
  },
  sunset: {
    name: 'Sunset',
    colors: ['#ff6b35', '#f7931e', '#fdc830', '#f37335', '#fc4a1a'],
    bg: '#1a0033'
  },
  ocean: {
    name: 'Ocean',
    colors: ['#00d4ff', '#0099ff', '#0066ff', '#0033ff', '#6600ff'],
    bg: '#000a1f'
  },
  fire: {
    name: 'Fire',
    colors: ['#ff0000', '#ff4400', '#ff8800', '#ffcc00', '#ffff00'],
    bg: '#1a0000'
  },
  matrix: {
    name: 'Matrix',
    colors: ['#00ff00', '#00cc00', '#009900', '#006600', '#00ff66'],
    bg: '#000000'
  },
  purple: {
    name: 'Purple Haze',
    colors: ['#9d00ff', '#cc00ff', '#ff00ff', '#ff00cc', '#ff0099'],
    bg: '#0d0015'
  }
};

const VISUALIZATION_MODES = [
  { id: 'spectrum', name: 'Spectrum' },
  { id: 'waveform', name: 'Waveform' },
  { id: 'circular', name: 'Circular' },
  { id: 'bars', name: 'Bars' },
  { id: 'particles', name: 'Particles' },
  { id: 'radial', name: 'Radial' }
];

export default function MusicVisualizer({ 
  audioContext,
  sourceNodeA,
  sourceNodeB,
  isPlaying,
  deckATrack,
  deckBTrack
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const particlesRef = useRef([]);
  const beatDetectorRef = useRef({ lastBeat: 0, threshold: 0.8 });
  
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState('spectrum');
  const [theme, setTheme] = useState('neon');
  const [intensity, setIntensity] = useState(70);
  const [beatSync, setBeatSync] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize analyser
  useEffect(() => {
    if (!audioContext || analyserRef.current) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    // Initialize particles
    for (let i = 0; i < 100; i++) {
      particlesRef.current.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        size: Math.random() * 3 + 1,
        energy: 0
      });
    }

    return () => {
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
    };
  }, [audioContext]);

  // Connect audio sources to analyser
  useEffect(() => {
    if (!analyserRef.current || !sourceNodeA || !sourceNodeB) return;

    try {
      sourceNodeA.connect(analyserRef.current);
      sourceNodeB.connect(analyserRef.current);
    } catch (e) {
      // Already connected or connection error
    }
  }, [sourceNodeA, sourceNodeB]);

  // Animation loop
  useEffect(() => {
    if (!visible || !canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const currentTheme = THEMES[theme];
    
    const detectBeat = (dataArray) => {
      const bass = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const now = Date.now();
      const detector = beatDetectorRef.current;
      
      if (bass > detector.threshold * 255 && now - detector.lastBeat > 300) {
        detector.lastBeat = now;
        return true;
      }
      return false;
    };

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      // Background with fade effect
      ctx.fillStyle = currentTheme.bg;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      const isBeat = beatSync && detectBeat(dataArray);
      const intensityFactor = intensity / 100;

      switch (mode) {
        case 'spectrum':
          drawSpectrum(ctx, dataArray, width, height, currentTheme, intensityFactor, isBeat);
          break;
        case 'waveform':
          drawWaveform(ctx, analyser, width, height, currentTheme, intensityFactor);
          break;
        case 'circular':
          drawCircular(ctx, dataArray, width, height, currentTheme, intensityFactor, isBeat);
          break;
        case 'bars':
          drawBars(ctx, dataArray, width, height, currentTheme, intensityFactor, isBeat);
          break;
        case 'particles':
          drawParticles(ctx, dataArray, width, height, currentTheme, intensityFactor, isBeat);
          break;
        case 'radial':
          drawRadial(ctx, dataArray, width, height, currentTheme, intensityFactor, isBeat);
          break;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visible, mode, theme, intensity, beatSync]);

  const drawSpectrum = (ctx, dataArray, width, height, theme, intensity, isBeat) => {
    const barWidth = width / dataArray.length * 2;
    const scale = isBeat ? 1.2 : 1;
    
    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i] / 255 * intensity;
      const barHeight = value * height * scale;
      const x = i * barWidth;
      const colorIndex = Math.floor(i / dataArray.length * theme.colors.length);
      
      ctx.fillStyle = theme.colors[colorIndex];
      ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
      
      // Mirror effect
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, 0, barWidth - 2, barHeight * 0.5);
      ctx.globalAlpha = 1;
    }
  };

  const drawWaveform = (ctx, analyser, width, height, theme, intensity) => {
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    
    ctx.lineWidth = 3 * intensity;
    ctx.strokeStyle = theme.colors[0];
    ctx.beginPath();
    
    const sliceWidth = width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
  };

  const drawCircular = (ctx, dataArray, width, height, theme, intensity, isBeat) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const scale = isBeat ? 1.15 : 1;
    
    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i] / 255 * intensity;
      const angle = (i / dataArray.length) * Math.PI * 2;
      const lineLength = value * radius * scale;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + lineLength);
      const y2 = centerY + Math.sin(angle) * (radius + lineLength);
      
      const colorIndex = Math.floor(i / dataArray.length * theme.colors.length);
      ctx.strokeStyle = theme.colors[colorIndex];
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const drawBars = (ctx, dataArray, width, height, theme, intensity, isBeat) => {
    const barCount = 64;
    const barWidth = width / barCount;
    const scale = isBeat ? 1.2 : 1;
    
    for (let i = 0; i < barCount; i++) {
      const index = Math.floor(i / barCount * dataArray.length);
      const value = dataArray[index] / 255 * intensity;
      const barHeight = value * height * scale;
      
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      const colorIndex = Math.floor(i / barCount * theme.colors.length);
      gradient.addColorStop(0, theme.colors[colorIndex]);
      gradient.addColorStop(1, theme.colors[(colorIndex + 1) % theme.colors.length]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 4, barHeight);
    }
  };

  const drawParticles = (ctx, dataArray, width, height, theme, intensity, isBeat) => {
    const avgEnergy = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
    
    particlesRef.current.forEach((particle, i) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around
      if (particle.x < 0 || particle.x > 1) particle.vx *= -1;
      if (particle.y < 0 || particle.y > 1) particle.vy *= -1;
      
      // Update energy from frequency data
      const dataIndex = Math.floor(i / particlesRef.current.length * dataArray.length);
      particle.energy = dataArray[dataIndex] / 255 * intensity;
      
      // React to beat
      if (isBeat) {
        particle.vx += (Math.random() - 0.5) * 0.001;
        particle.vy += (Math.random() - 0.5) * 0.001;
      }
      
      // Draw particle
      const x = particle.x * width;
      const y = particle.y * height;
      const size = particle.size * (1 + particle.energy * 2) * (isBeat ? 1.5 : 1);
      
      const colorIndex = Math.floor(particle.energy * theme.colors.length);
      ctx.fillStyle = theme.colors[Math.min(colorIndex, theme.colors.length - 1)];
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Trail effect
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x - particle.vx * 100, y - particle.vy * 100, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  };

  const drawRadial = (ctx, dataArray, width, height, theme, intensity, isBeat) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const rings = 5;
    const scale = isBeat ? 1.2 : 1;
    
    for (let ring = 0; ring < rings; ring++) {
      const baseRadius = (ring + 1) * Math.min(width, height) / (rings * 3);
      
      ctx.beginPath();
      for (let i = 0; i <= dataArray.length; i++) {
        const angle = (i / dataArray.length) * Math.PI * 2;
        const value = dataArray[i % dataArray.length] / 255 * intensity;
        const radius = baseRadius + value * 50 * scale;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      const colorIndex = ring % theme.colors.length;
      ctx.strokeStyle = theme.colors[colorIndex];
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  return (
    <div className="relative bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{ minHeight: '200px', height: '100%' }}
      />

      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          onClick={() => setShowSettings(!showSettings)}
          size="icon"
          variant="outline"
          className="bg-zinc-900/80 backdrop-blur border-zinc-700 hover:bg-zinc-800"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => setVisible(!visible)}
          size="icon"
          variant="outline"
          className="bg-zinc-900/80 backdrop-blur border-zinc-700 hover:bg-zinc-800"
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-2 left-2 right-2 bg-zinc-900/95 backdrop-blur-lg border border-zinc-700 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 uppercase font-medium">Visualization</label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {VISUALIZATION_MODES.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Theme Selection */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 uppercase font-medium flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Theme
              </label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {Object.entries(THEMES).map(([key, t]) => (
                    <SelectItem key={key} value={key}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400 uppercase font-medium">Intensity</label>
              <span className="text-xs text-white font-mono">{intensity}%</span>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={(v) => setIntensity(v[0])}
              className="cursor-pointer"
            />
          </div>

          {/* Beat Sync Toggle */}
          <Button
            onClick={() => setBeatSync(!beatSync)}
            variant="outline"
            size="sm"
            className={cn(
              "w-full",
              beatSync 
                ? "bg-violet-600 border-violet-500 text-white" 
                : "bg-zinc-800 border-zinc-700 text-zinc-400"
            )}
          >
            Beat Sync {beatSync ? 'ON' : 'OFF'}
          </Button>
        </div>
      )}
      
      {/* Track Info Overlay */}
      {(deckATrack || deckBTrack) && (
        <div className="absolute bottom-2 left-2 bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded px-3 py-1.5 text-xs text-white">
          {deckATrack && <span className="text-blue-400">A: {deckATrack.title}</span>}
          {deckATrack && deckBTrack && <span className="text-zinc-500 mx-2">•</span>}
          {deckBTrack && <span className="text-fuchsia-400">B: {deckBTrack.title}</span>}
        </div>
      )}
    </div>
  );
}