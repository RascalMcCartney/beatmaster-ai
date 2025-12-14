import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2, TrendingUp, Clock, Zap, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SetVisualization({ set }) {
  const energyData = set.energy_curve?.map((energy, idx) => ({
    position: idx + 1,
    energy: energy,
  })) || [];

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTransitionColor = (type) => {
    switch (type) {
      case 'harmonic_blend': return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      case 'quick_cut': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'echo_out': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'energy_boost': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Energy Curve Chart */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          Energy Progression
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis 
              dataKey="position" 
              stroke="#71717a"
              label={{ value: 'Track Position', position: 'insideBottom', offset: -5, fill: '#71717a' }}
            />
            <YAxis 
              stroke="#71717a"
              domain={[0, 10]}
              label={{ value: 'Energy', angle: -90, position: 'insideLeft', fill: '#71717a' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="energy" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Track Sequence */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Music2 className="w-5 h-5 text-violet-400" />
          Track Sequence & Mixing Points
        </h3>
        
        <ScrollArea className="h-[800px]">
          <div className="space-y-4 pr-4">
            {set.tracks.map((track, idx) => (
              <div key={idx} className="relative">
                <div className="bg-zinc-800/50 rounded-xl p-4 border-2 border-zinc-700 hover:border-violet-500/50 transition-all">
                  {/* Track Header */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold flex-shrink-0">
                      {track.position}
                    </div>
                    
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {track.fullTrackData?.artwork_url ? (
                        <img 
                          src={track.fullTrackData.artwork_url} 
                          alt={track.track_title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
                          <Music2 className="w-6 h-6 text-violet-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{track.track_title}</h4>
                      <p className="text-sm text-zinc-400 truncate">{track.track_artist}</p>
                      
                      {/* Track Metadata */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {track.fullTrackData?.bpm && (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                            {track.fullTrackData.bpm} BPM
                          </Badge>
                        )}
                        {track.fullTrackData?.key && (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                            {track.fullTrackData.key}
                          </Badge>
                        )}
                        {track.fullTrackData?.camelot && (
                          <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                            {track.fullTrackData.camelot}
                          </Badge>
                        )}
                        {track.fullTrackData?.energy && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                            E: {track.fullTrackData.energy}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mixing Instructions */}
                  <div className="bg-zinc-900/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                        Mixing Points
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Entry Point</div>
                        <div className="text-sm text-white font-mono">
                          <Clock className="w-3 h-3 inline mr-1 text-emerald-400" />
                          {formatTime(track.entry_point)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Exit Point</div>
                        <div className="text-sm text-white font-mono">
                          <Clock className="w-3 h-3 inline mr-1 text-red-400" />
                          {formatTime(track.exit_point)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-300 leading-relaxed">
                      {track.mixing_notes}
                    </div>
                  </div>

                  {/* Reasoning */}
                  {track.reasoning && (
                    <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700">
                      <div className="text-xs text-zinc-500 mb-1">Track Selection Reasoning</div>
                      <div className="text-xs text-zinc-300 leading-relaxed">
                        {track.reasoning}
                      </div>
                    </div>
                  )}
                </div>

                {/* Transition Indicator */}
                {idx < set.tracks.length - 1 && (
                  <div className="flex items-center justify-center my-2">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <Badge className={`mx-3 ${getTransitionColor(track.transition_type)}`}>
                      <ArrowRight className="w-3 h-3 mr-1" />
                      {track.transition_type?.replace(/_/g, ' ') || 'transition'}
                    </Badge>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}