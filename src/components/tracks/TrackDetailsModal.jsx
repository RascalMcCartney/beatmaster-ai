import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music2, Mic, Zap, Activity, Waves, Disc3, 
  Clock, TrendingUp, Gauge, Lightbulb, Play, ArrowRight,
  Speaker, Sparkles, Wind, Target, BarChart3, Info
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { findCompatibleTracks, getCompatibleCamelotKeys } from '../utils/camelotWheel';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const StatBar = ({ label, value, max = 10, icon: Icon, color = "violet" }) => {
  const colorClasses = {
    violet: "bg-violet-500",
    fuchsia: "bg-fuchsia-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-zinc-400">
          {Icon && <Icon className="w-4 h-4" />}
          <span>{label}</span>
        </div>
        <span className="text-white font-medium">{value}/{max}</span>
      </div>
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", colorClasses[color])}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
};

const SectionBadge = ({ label, start, end }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
    <span className="text-sm text-zinc-300">{label}</span>
    <span className="text-xs text-zinc-500 font-mono">
      {formatTime(start)} - {formatTime(end)}
    </span>
  </div>
);

export default function TrackDetailsModal({ track, open, onOpenChange, onPlayTrack, onGeneratePlaylist }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
    enabled: !!track,
  });

  const compatibleTracks = useMemo(() => {
    if (!track || !allTracks.length) return [];
    return findCompatibleTracks(track, allTracks, 8);
  }, [track, allTracks]);

  const compatibleCamelotKeys = useMemo(() => {
    if (!track?.camelot || typeof track.camelot !== 'string') return [];
    return getCompatibleCamelotKeys(track.camelot);
  }, [track?.camelot]);

  if (!track) return null;

  const structure = track.structure || {};
  const hasStructure = structure.intro || structure.verse?.length > 0 || structure.chorus?.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Track Analysis</DialogTitle>
        </DialogHeader>

        {/* Header with Artwork */}
        <div className="flex gap-4 pb-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-xl">
            {track.artwork_url ? (
              <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <Music2 className="w-10 h-10 text-white/50" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">{track.title}</h2>
            <p className="text-zinc-400 mb-2">{track.artist || 'Unknown Artist'}</p>
            <div className="flex flex-wrap gap-2">
              {track.sub_genre && (
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  {track.sub_genre}
                </Badge>
              )}
              {track.track_type && (
                <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                  <Mic className="w-3 h-3 mr-1" />
                  {track.track_type}
                </Badge>
              )}
              {track.mood && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  {track.mood}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-zinc-800 w-full justify-start">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-700">
              <Info className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-zinc-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-zinc-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="mixing" className="data-[state=active]:bg-zinc-700">
              <Disc3 className="w-4 h-4 mr-2" />
              DJ Mixing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(90vh-280px)]">
              <div className="space-y-6 pr-4">

                {/* Technical Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-violet-400" />
                    Technical Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'BPM', value: track.bpm, color: 'violet' },
                      { label: 'Key', value: track.key, color: 'fuchsia' },
                      { label: 'Energy', value: `${track.energy}/10`, color: 'amber' },
                      { label: 'Camelot', value: track.camelot, color: 'emerald' },
                    ].map(item => item.value && (
                      <div key={item.label} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                        <div className="text-xs text-zinc-500 mb-1">{item.label}</div>
                        <div className={cn(
                          "text-2xl font-bold",
                          `text-${item.color}-400`
                        )}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    {track.danceability && (
                      <StatBar 
                        label="Danceability" 
                        value={track.danceability} 
                        icon={Disc3}
                        color="violet"
                      />
                    )}
                    {track.mixability && (
                      <StatBar 
                        label="DJ Mixability" 
                        value={track.mixability} 
                        icon={Waves}
                        color="fuchsia"
                      />
                    )}
                    {track.energy && (
                      <StatBar 
                        label="Energy Level" 
                        value={track.energy} 
                        icon={Zap}
                        color="red"
                      />
                    )}
                    {track.emotional_intensity && (
                      <StatBar 
                        label="Emotional Intensity" 
                        value={track.emotional_intensity} 
                        icon={Sparkles}
                        color="amber"
                      />
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(90vh-280px)]">
              <div className="space-y-6 pr-4">

                {/* Production & Audio Quality */}
                {(track.production_quality || track.instrumentation_density || track.dynamic_range) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Speaker className="w-5 h-5 text-violet-400" />
                      Production & Audio Quality
                    </h3>
                    <div className="space-y-4">
                      {track.production_quality && (
                        <StatBar 
                          label="Production Quality" 
                          value={track.production_quality} 
                          icon={Target}
                          color="emerald"
                        />
                      )}
                      {track.instrumentation_density && (
                        <StatBar 
                          label="Instrumentation Density" 
                          value={track.instrumentation_density} 
                          icon={BarChart3}
                          color="blue"
                        />
                      )}
                      {track.dynamic_range && (
                        <StatBar 
                          label="Dynamic Range" 
                          value={track.dynamic_range} 
                          icon={Activity}
                          color="violet"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Track Dynamics */}
                {(track.buildup_intensity || track.drop_impact || track.vocal_intensity) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Wind className="w-5 h-5 text-violet-400" />
                      Track Dynamics
                    </h3>
                    <div className="space-y-4">
                      {track.buildup_intensity && (
                        <StatBar 
                          label="Buildup Intensity" 
                          value={track.buildup_intensity} 
                          icon={TrendingUp}
                          color="amber"
                        />
                      )}
                      {track.drop_impact && (
                        <StatBar 
                          label="Drop Impact" 
                          value={track.drop_impact} 
                          icon={Zap}
                          color="red"
                        />
                      )}
                      {track.vocal_intensity && (
                        <StatBar 
                          label="Vocal Intensity" 
                          value={track.vocal_intensity} 
                          icon={Mic}
                          color="fuchsia"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Complexity */}
                {(track.rhythmic_complexity || track.melodic_complexity) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-violet-400" />
                      Complexity Analysis
                    </h3>
                    <div className="space-y-4">
                      {track.rhythmic_complexity && (
                        <StatBar 
                          label="Rhythmic Complexity" 
                          value={track.rhythmic_complexity} 
                          color="emerald"
                        />
                      )}
                      {track.melodic_complexity && (
                        <StatBar 
                          label="Melodic Complexity" 
                          value={track.melodic_complexity} 
                          color="blue"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="mixing" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(90vh-280px)]">
              <div className="space-y-6 pr-4">

                {/* DJ Mix Notes */}
                {track.mix_notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-violet-400" />
                      DJ Mixing Notes
                    </h3>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                      <p className="text-sm text-zinc-300 leading-relaxed">{track.mix_notes}</p>
                    </div>
                  </div>
                )}

                {/* Track Structure */}
                {hasStructure && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-violet-400" />
                      Track Structure
                    </h3>
                    <div className="space-y-2">
                      {structure.intro?.start !== undefined && (
                        <SectionBadge 
                          label="Intro" 
                          start={structure.intro.start} 
                          end={structure.intro.end} 
                        />
                      )}
                      
                      {structure.verse?.map((verse, idx) => (
                        <SectionBadge 
                          key={`verse-${idx}`}
                          label={`Verse ${idx + 1}`} 
                          start={verse.start} 
                          end={verse.end} 
                        />
                      ))}
                      
                      {structure.chorus?.map((chorus, idx) => (
                        <SectionBadge 
                          key={`chorus-${idx}`}
                          label={`Chorus ${idx + 1}`} 
                          start={chorus.start} 
                          end={chorus.end} 
                        />
                      ))}
                      
                      {structure.breakdown?.map((breakdown, idx) => (
                        <SectionBadge 
                          key={`breakdown-${idx}`}
                          label={`Breakdown ${idx + 1}`} 
                          start={breakdown.start} 
                          end={breakdown.end} 
                        />
                      ))}
                      
                      {structure.drop?.map((drop, idx) => (
                        <SectionBadge 
                          key={`drop-${idx}`}
                          label={`Drop ${idx + 1}`} 
                          start={drop.start} 
                          end={drop.end} 
                        />
                      ))}
                      
                      {structure.bridge?.start !== undefined && (
                        <SectionBadge 
                          label="Bridge" 
                          start={structure.bridge.start} 
                          end={structure.bridge.end} 
                        />
                      )}
                      
                      {structure.outro?.start !== undefined && (
                        <SectionBadge 
                          label="Outro" 
                          start={structure.outro.start} 
                          end={structure.outro.end} 
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Visual Timeline */}
                {hasStructure && track.duration && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Visual Timeline</h3>
                    <div className="relative h-12 bg-zinc-800 rounded-lg overflow-hidden">
                      {structure.intro?.start !== undefined && (
                        <div 
                          className="absolute top-0 h-full bg-blue-500/30 border-l-2 border-blue-500"
                          style={{
                            left: `${(structure.intro.start / track.duration) * 100}%`,
                            width: `${((structure.intro.end - structure.intro.start) / track.duration) * 100}%`
                          }}
                        />
                      )}
                      {structure.verse?.map((verse, idx) => (
                        <div 
                          key={`v-${idx}`}
                          className="absolute top-0 h-full bg-violet-500/30 border-l-2 border-violet-500"
                          style={{
                            left: `${(verse.start / track.duration) * 100}%`,
                            width: `${((verse.end - verse.start) / track.duration) * 100}%`
                          }}
                        />
                      ))}
                      {structure.chorus?.map((chorus, idx) => (
                        <div 
                          key={`c-${idx}`}
                          className="absolute top-0 h-full bg-fuchsia-500/30 border-l-2 border-fuchsia-500"
                          style={{
                            left: `${(chorus.start / track.duration) * 100}%`,
                            width: `${((chorus.end - chorus.start) / track.duration) * 100}%`
                          }}
                        />
                      ))}
                      {structure.drop?.map((drop, idx) => (
                        <div 
                          key={`d-${idx}`}
                          className="absolute top-0 h-full bg-red-500/30 border-l-2 border-red-500"
                          style={{
                            left: `${(drop.start / track.duration) * 100}%`,
                            width: `${((drop.end - drop.start) / track.duration) * 100}%`
                          }}
                        />
                      ))}
                      {structure.outro?.start !== undefined && (
                        <div 
                          className="absolute top-0 h-full bg-emerald-500/30 border-l-2 border-emerald-500"
                          style={{
                            left: `${(structure.outro.start / track.duration) * 100}%`,
                            width: `${((structure.outro.end - structure.outro.start) / track.duration) * 100}%`
                          }}
                        />
                      )}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-zinc-500">
                      <span>0:00</span>
                      <span>{formatTime(track.duration)}</span>
                    </div>
                  </div>
                )}

                {/* Harmonic Compatibility */}
                {track.camelot && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Disc3 className="w-5 h-5 text-violet-400" />
                        Harmonic Compatibility
                      </h3>
                      <Button
                        onClick={() => {
                          onGeneratePlaylist?.(track);
                          onOpenChange(false);
                        }}
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Generate Playlist
                      </Button>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-zinc-400">Current Key</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                            {track.key}
                          </Badge>
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            {track.camelot}
                          </Badge>
                        </div>
                      </div>
                      <Separator className="bg-zinc-700 mb-3" />
                      <div>
                        <span className="text-sm text-zinc-400 mb-2 block">Compatible Keys (Camelot Wheel)</span>
                        <div className="flex flex-wrap gap-2">
                          {compatibleCamelotKeys.map(key => (
                            <Badge 
                              key={key}
                              variant="outline" 
                              className={cn(
                                "border-zinc-700",
                                key === track.camelot 
                                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30" 
                                  : "text-zinc-400"
                              )}
                            >
                              {key}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compatible Tracks */}
                {compatibleTracks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5 text-violet-400" />
                      Mix Well With ({compatibleTracks.length})
                    </h3>
                    <div className="space-y-2">
                      {compatibleTracks.map(compatTrack => (
                        <div 
                          key={compatTrack.id}
                          className="group flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-all cursor-pointer"
                          onClick={() => {
                            onPlayTrack?.(compatTrack);
                            onOpenChange(false);
                          }}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            {compatTrack.artwork_url ? (
                              <img src={compatTrack.artwork_url} alt={compatTrack.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                <Music2 className="w-5 h-5 text-zinc-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                              {compatTrack.title}
                            </h4>
                            <p className="text-xs text-zinc-500 truncate">{compatTrack.artist}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {compatTrack.bpm && (
                              <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono">
                                {compatTrack.bpm}
                              </Badge>
                            )}
                            {compatTrack.camelot && (
                              <Badge variant="outline" className="border-emerald-700 text-emerald-400">
                                {compatTrack.camelot}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                compatTrack.compatibilityScore >= 70 ? "bg-green-500" :
                                compatTrack.compatibilityScore >= 50 ? "bg-yellow-500" :
                                "bg-orange-500"
                              )} />
                              <span className="text-zinc-500 font-medium">{compatTrack.compatibilityScore}%</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack?.(compatTrack);
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(90vh-280px)]">
              <div className="space-y-6 pr-4">
                {/* Atmosphere & Mood */}
                {(track.atmosphere || track.mood_tags?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                      Atmosphere & Mood
                    </h3>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 space-y-3">
                      {track.atmosphere && (
                        <div>
                          <div className="text-xs text-zinc-500 mb-2">Atmosphere</div>
                          <p className="text-sm text-zinc-300 capitalize">{track.atmosphere}</p>
                        </div>
                      )}
                      {track.mood_tags?.length > 0 && (
                        <div>
                          <div className="text-xs text-zinc-500 mb-2">Mood Tags</div>
                          <div className="flex flex-wrap gap-2">
                            {track.mood_tags.map((tag, idx) => (
                              <Badge 
                                key={idx}
                                variant="outline" 
                                className="border-amber-500/30 text-amber-300 bg-amber-500/10"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Instrumentation */}
                {track.instrumentation?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Music2 className="w-5 h-5 text-violet-400" />
                      Instrumentation
                    </h3>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                      <div className="flex flex-wrap gap-2">
                        {track.instrumentation.map((instrument, idx) => (
                          <Badge 
                            key={idx}
                            variant="outline" 
                            className="border-blue-500/30 text-blue-300 bg-blue-500/10"
                          >
                            {instrument}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Harmonic Progression */}
                {(track.harmonic_progression || track.chord_progression?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Music2 className="w-5 h-5 text-violet-400" />
                      Harmonic Analysis
                    </h3>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 space-y-3">
                      {track.harmonic_progression && (
                        <div>
                          <div className="text-xs text-zinc-500 mb-2">Harmonic Progression</div>
                          <p className="text-sm text-zinc-300">{track.harmonic_progression}</p>
                        </div>
                      )}
                      {track.chord_progression?.length > 0 && (
                        <div>
                          <div className="text-xs text-zinc-500 mb-2">Chord Progression</div>
                          <div className="flex flex-wrap gap-2">
                            {track.chord_progression.map((chord, idx) => (
                              <Badge 
                                key={idx}
                                variant="outline" 
                                className="border-violet-500/30 text-violet-300 bg-violet-500/10"
                              >
                                {chord}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lyrics */}
                {track.lyrics && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Mic className="w-5 h-5 text-violet-400" />
                      Lyrics
                    </h3>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{track.lyrics}</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}