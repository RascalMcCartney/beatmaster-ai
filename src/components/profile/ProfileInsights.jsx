import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, Calendar, Music2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileInsights({ tracks, listeningHistory, playlists }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Prepare data for analysis
      const genreCount = tracks.reduce((acc, t) => {
        const genre = t?.sub_genre || t?.genre;
        if (genre) acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});

      const topGenres = Object.entries(genreCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre, count]) => ({ genre, count }));

      const avgBPM = tracks.filter(t => t?.bpm).reduce((acc, t) => acc + (t?.bpm || 0), 0) / tracks.filter(t => t?.bpm).length || 0;
      const avgEnergy = tracks.filter(t => t?.energy).reduce((acc, t) => acc + (t?.energy || 0), 0) / tracks.filter(t => t?.energy).length || 0;

      // Advanced metrics
      const avgRhythmicComplexity = tracks.filter(t => t?.rhythmic_complexity).reduce((acc, t) => acc + (t?.rhythmic_complexity || 0), 0) / tracks.filter(t => t?.rhythmic_complexity).length || 0;
      const avgMelodicComplexity = tracks.filter(t => t?.melodic_complexity).reduce((acc, t) => acc + (t?.melodic_complexity || 0), 0) / tracks.filter(t => t?.melodic_complexity).length || 0;
      const avgEmotionalIntensity = tracks.filter(t => t?.emotional_intensity).reduce((acc, t) => acc + (t?.emotional_intensity || 0), 0) / tracks.filter(t => t?.emotional_intensity).length || 0;
      const avgProductionQuality = tracks.filter(t => t?.production_quality).reduce((acc, t) => acc + (t?.production_quality || 0), 0) / tracks.filter(t => t?.production_quality).length || 0;

      // Mood analysis
      const allMoodTags = tracks.flatMap(t => t.mood_tags || []);
      const moodCount = allMoodTags.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {});
      const topMoods = Object.entries(moodCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([mood, count]) => ({ mood, count }));

      // Instrumentation analysis
      const allInstrumentation = tracks.flatMap(t => t.instrumentation || []);
      const instrumentCount = allInstrumentation.reduce((acc, inst) => {
        acc[inst] = (acc[inst] || 0) + 1;
        return acc;
      }, {});
      const topInstruments = Object.entries(instrumentCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([instrument, count]) => ({ instrument, count }));

      // Atmosphere analysis
      const atmosphereCount = tracks.reduce((acc, t) => {
        if (t?.atmosphere) acc[t.atmosphere] = (acc[t.atmosphere] || 0) + 1;
        return acc;
      }, {});
      const topAtmospheres = Object.entries(atmosphereCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Harmonic analysis
      const keyCount = tracks.reduce((acc, t) => {
        if (t?.key) acc[t.key] = (acc[t.key] || 0) + 1;
        return acc;
      }, {});
      const topKeys = Object.entries(keyCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const trackPlayCount = listeningHistory.reduce((acc, h) => {
        acc[h?.track_id] = (acc[h?.track_id] || 0) + 1;
        return acc;
      }, {});

      const mostPlayedTrack = tracks.map(t => ({
        title: t?.title || 'Unknown',
        artist: t?.artist || 'Unknown',
        plays: trackPlayCount[t?.id] || 0
      })).sort((a, b) => b.plays - a.plays)[0];

      const prompt = `You are an expert music analyst, producer, and DJ with deep knowledge of music theory, harmonic analysis, and production techniques. Analyze this user's music profile with comprehensive depth:

**Library Statistics:**
- Total Tracks: ${tracks.length}
- Total Playlists: ${playlists.length}
- Total Listening Sessions: ${listeningHistory.length}
- Average BPM: ${avgBPM.toFixed(1)}
- Average Energy: ${avgEnergy.toFixed(1)}/10
- Average Rhythmic Complexity: ${avgRhythmicComplexity.toFixed(1)}/10
- Average Melodic Complexity: ${avgMelodicComplexity.toFixed(1)}/10
- Average Emotional Intensity: ${avgEmotionalIntensity.toFixed(1)}/10
- Average Production Quality: ${avgProductionQuality.toFixed(1)}/10

**Top Genres:**
${topGenres && topGenres.length > 0 ? topGenres.map(g => `- ${g?.genre || 'Unknown'}: ${g?.count || 0} tracks`).join('\n') : 'No genre data'}

**Top Moods:**
${topMoods && topMoods.length > 0 ? topMoods.map(m => `- ${m?.mood || 'Unknown'}: ${m?.count || 0} occurrences`).join('\n') : 'No mood data'}

**Top Instruments/Sounds:**
${topInstruments && topInstruments.length > 0 ? topInstruments.map(i => `- ${i?.instrument || 'Unknown'}: ${i?.count || 0} tracks`).join('\n') : 'No instrumentation data'}

**Common Atmospheres:**
${topAtmospheres && topAtmospheres.length > 0 ? topAtmospheres.map(([atm, count]) => `- ${atm || 'Unknown'}: ${count || 0} tracks`).join('\n') : 'No atmosphere data'}

**Preferred Keys:**
${topKeys && topKeys.length > 0 ? topKeys.map(([key, count]) => `- ${key || 'Unknown'}: ${count || 0} tracks`).join('\n') : 'No key data'}

**Most Played Track:**
${mostPlayedTrack ? `${mostPlayedTrack.title || 'Unknown'} by ${mostPlayedTrack.artist || 'Unknown'} (${mostPlayedTrack.plays || 0} plays)` : 'No play data yet'}

**Recent Listening Pattern:**
${listeningHistory && listeningHistory.length > 0 ? listeningHistory.slice(0, 20).map(h => `- ${h?.track_title || 'Unknown'} (${h?.track_genre || 'Unknown'})`).join('\n') : 'No listening history'}

Generate an in-depth, technical analysis including:
1. **Listening Personality**: Their sonic identity and what drives their musical choices
2. **Genre & Style Analysis**: Deep dive into genre preferences and stylistic patterns
3. **Harmonic & Mood Preferences**: Analyze key preferences, mood patterns, and emotional intensity trends
4. **Production & Sound Design Appreciation**: What production styles, instrumentation, and sonic textures they gravitate toward
5. **Complexity & Musicality**: Their tolerance for rhythmic/melodic complexity and preference for layered vs minimal production
6. **DJ Style & Mixing Identity**: Their mixing philosophy based on library characteristics
7. **Recommendations**: Specific tracks, artists, and sonic territories to explore based on harmonic and stylistic analysis
8. **Collection Strengths**: Unique aspects of their curation
9. **Growth Opportunities**: Areas to expand musically and harmonically

Be deeply insightful, technical when appropriate, reference specific musical concepts, and make it personal and engaging.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            listening_personality: { type: "string" },
            genre_analysis: { type: "string" },
            harmonic_mood_preferences: { type: "string" },
            production_sound_design: { type: "string" },
            complexity_musicality: { type: "string" },
            dj_style: { type: "string" },
            recommendations: { type: "string" },
            collection_strengths: { type: "string" },
            growth_opportunities: { type: "string" },
            key_metrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                  insight: { type: "string" }
                }
              }
            }
          }
        }
      });

      setInsights(result);
      toast.success('Insights generated successfully');
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const sections = insights ? [
    { icon: TrendingUp, title: 'Listening Personality', content: insights.listening_personality, color: 'text-violet-400' },
    { icon: Music2, title: 'Genre & Style Analysis', content: insights.genre_analysis, color: 'text-fuchsia-400' },
    { icon: Sparkles, title: 'Harmonic & Mood Preferences', content: insights.harmonic_mood_preferences, color: 'text-emerald-400' },
    { icon: Music2, title: 'Production & Sound Design', content: insights.production_sound_design, color: 'text-blue-400' },
    { icon: TrendingUp, title: 'Complexity & Musicality', content: insights.complexity_musicality, color: 'text-pink-400' },
    { icon: Sparkles, title: 'DJ Style & Mixing Identity', content: insights.dj_style, color: 'text-cyan-400' },
    { icon: TrendingUp, title: 'Recommendations', content: insights.recommendations, color: 'text-amber-400' },
    { icon: Music2, title: 'Collection Strengths', content: insights.collection_strengths, color: 'text-purple-400' },
    { icon: Calendar, title: 'Growth Opportunities', content: insights.growth_opportunities, color: 'text-teal-400' },
  ] : [];

  return (
    <div className="space-y-6">
      {!insights ? (
        <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Generate AI Insights</h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Get personalized insights about your music taste, listening patterns, and DJ style based on your library and listening history.
          </p>
          <Button
            onClick={generateInsights}
            disabled={loading || tracks.length === 0}
            size="lg"
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Your Music Profile...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
          {tracks.length === 0 && (
            <p className="text-sm text-zinc-500 mt-4">Add tracks to your library first</p>
          )}
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          {insights.key_metrics && insights.key_metrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.key_metrics.map((metric, idx) => (
                <Card key={idx} className="bg-zinc-900 border-zinc-800 p-6">
                  <div className="text-sm text-zinc-400 mb-1">{metric.label}</div>
                  <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
                  <div className="text-xs text-zinc-500">{metric.insight}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Insight Sections */}
          <div className="grid gap-6">
            {sections.map((section, idx) => (
              <Card key={idx} className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center ${section.color}`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                </div>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{section.content}</p>
              </Card>
            ))}
          </div>

          {/* Regenerate Button */}
          <div className="text-center">
            <Button
              onClick={generateInsights}
              disabled={loading}
              variant="outline"
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerate Insights
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}