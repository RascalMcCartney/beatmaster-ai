import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Music2, Clock, Sparkles, Star, TrendingUp, Loader2, Play } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import TrackCard from '@/components/tracks/TrackCard';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Album() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const albumName = urlParams.get('name');
  const artistName = urlParams.get('artist');

  const [aiContent, setAiContent] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: tracks = [] } = useQuery({
    queryKey: ['album-tracks', albumName, artistName],
    queryFn: () => base44.entities.Track.filter({ album: albumName, artist: artistName }),
    enabled: !!albumName
  });

  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list()
  });

  useEffect(() => {
    if (albumName && tracks.length > 0) {
      generateAIContent();
    }
  }, [albumName, tracks.length]);

  const generateAIContent = async () => {
    setLoadingAI(true);
    try {
      const trackDetails = tracks.map(t => ({
        title: t.title,
        genre: t.genre,
        sub_genre: t.sub_genre,
        bpm: t.bpm,
        key: t.key,
        energy: t.energy,
        mood: t.mood,
        mood_tags: t.mood_tags,
        danceability: t.danceability,
        mixability: t.mixability,
        emotional_intensity: t.emotional_intensity,
        atmosphere: t.atmosphere,
        production_quality: t.production_quality,
        instrumentation: t.instrumentation,
        track_type: t.track_type
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional music critic and electronic music expert with deep knowledge of album production, sonic cohesion, and artistic vision.

Review the album "${albumName}" by "${artistName}" based on these tracks:
${JSON.stringify(trackDetails, null, 2)}

Provide:

1. ALBUM REVIEW:
   - Write a comprehensive 3-4 paragraph review
   - Discuss the album's artistic vision, sonic cohesion, and overall quality
   - Analyze production techniques, mixing, and mastering
   - Comment on emotional journey and flow between tracks
   - Be specific about strengths and notable elements
   - Rate overall album quality (1-10)

2. TRACK-BY-TRACK ANALYSIS:
   - For each track, provide:
     * 2-3 sentence analysis of what makes it unique
     * How it contributes to the album's narrative
     * Production highlights and standout elements
     * Key moments or transitions
   - Match track titles exactly from the data

3. SONIC IDENTITY:
   - Describe the album's overall sonic palette
   - Identify recurring production techniques and sounds
   - Discuss genre classification and innovations
   - Comment on cohesiveness and variety

4. STANDOUT MOMENTS:
   - Identify 3-5 peak moments across the album
   - Describe why these moments are significant
   - Include specific track references

5. COMPLEMENTARY RECOMMENDATIONS:
   - Suggest 5-7 similar albums that fans would enjoy
   - Include artist name and album title
   - Brief explanation of why it's recommended
   
6. SIMILAR ARTISTS:
   - Recommend 4-6 artists with similar sound/style
   - Include brief descriptions

Be professional, insightful, and specific. Focus on electronic music and DJ culture.`,
        response_json_schema: {
          type: "object",
          properties: {
            review: { type: "string" },
            rating: { type: "number" },
            track_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  track_title: { type: "string" },
                  analysis: { type: "string" },
                  highlights: { type: "string" }
                }
              }
            },
            sonic_identity: { type: "string" },
            standout_moments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  moment: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            complementary_albums: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  artist: { type: "string" },
                  album: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            similar_artists: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiContent(result);
    } catch (error) {
      console.error('AI content generation error:', error);
    }
    setLoadingAI(false);
  };

  const stats = {
    totalTracks: tracks.length,
    totalDuration: tracks.reduce((sum, t) => sum + (t.duration || 0), 0),
    avgBPM: Math.round(tracks.reduce((sum, t) => sum + (t.bpm || 0), 0) / tracks.length),
    avgEnergy: (tracks.reduce((sum, t) => sum + (t.energy || 0), 0) / tracks.length).toFixed(1),
    avgProduction: (tracks.reduce((sum, t) => sum + (t.production_quality || 0), 0) / tracks.length).toFixed(1),
    genres: [...new Set(tracks.map(t => t.genre).filter(Boolean))],
    moods: [...new Set(tracks.flatMap(t => t.mood_tags || []).filter(Boolean))]
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (!albumName) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">
        <p>No album selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => artistName ? navigate(createPageUrl('Artist') + `?name=${encodeURIComponent(artistName)}`) : navigate(createPageUrl('Library'))}
            className="mb-6 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-8">
            {/* Album Artwork */}
            <div className="w-64 h-64 rounded-2xl bg-zinc-800 flex items-center justify-center flex-shrink-0 shadow-2xl">
              {tracks[0]?.artwork_url ? (
                <img src={tracks[0].artwork_url} alt={albumName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Music2 className="w-24 h-24 text-zinc-600" />
              )}
            </div>

            {/* Album Info */}
            <div className="flex-1 flex flex-col justify-end">
              <Badge className="bg-zinc-800 text-zinc-300 border-0 w-fit mb-2">Album</Badge>
              <h1 className="text-5xl font-black mb-2">{albumName}</h1>
              {artistName && (
                <p className="text-2xl text-zinc-400 mb-4 cursor-pointer hover:text-white transition-colors"
                   onClick={() => navigate(createPageUrl('Artist') + `?name=${encodeURIComponent(artistName)}`)}>
                  {artistName}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span>{stats.totalTracks} tracks</span>
                <span>•</span>
                <span>{formatTotalDuration(stats.totalDuration)}</span>
                {aiContent?.rating && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white font-semibold">{aiContent.rating}/10</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="text-2xl font-bold">{stats.totalTracks}</div>
            <div className="text-xs text-zinc-500">Tracks</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="text-2xl font-bold">{formatTotalDuration(stats.totalDuration)}</div>
            <div className="text-xs text-zinc-500">Duration</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="text-2xl font-bold">{stats.avgBPM}</div>
            <div className="text-xs text-zinc-500">Avg BPM</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="text-2xl font-bold">{stats.avgEnergy}</div>
            <div className="text-xs text-zinc-500">Avg Energy</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="text-2xl font-bold">{stats.avgProduction}</div>
            <div className="text-xs text-zinc-500">Production</div>
          </Card>
        </div>

        {/* AI Content Loading */}
        {loadingAI && (
          <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              <span className="text-zinc-400">Generating AI review and analysis...</span>
            </div>
          </Card>
        )}

        {/* AI Content */}
        {aiContent && (
          <Tabs defaultValue="review" className="mb-8">
            <TabsList className="bg-zinc-900 border-b border-zinc-800">
              <TabsTrigger value="review">Review</TabsTrigger>
              <TabsTrigger value="analysis">Track Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="tracks">Tracklist</TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="space-y-6 mt-6">
              {/* Album Review */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <h2 className="text-xl font-bold">Album Review</h2>
                    <Badge className="bg-violet-500/20 text-violet-400 border-0">AI Generated</Badge>
                  </div>
                  {aiContent.rating && (
                    <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-full">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span className="text-xl font-bold">{aiContent.rating}/10</span>
                    </div>
                  )}
                </div>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{aiContent.review}</p>
              </Card>

              {/* Sonic Identity */}
              {aiContent.sonic_identity && (
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <h3 className="text-lg font-bold mb-3">Sonic Identity</h3>
                  <p className="text-zinc-300 leading-relaxed">{aiContent.sonic_identity}</p>
                </Card>
              )}

              {/* Standout Moments */}
              {aiContent.standout_moments?.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <h3 className="text-lg font-bold mb-4">Standout Moments</h3>
                  <div className="space-y-4">
                    {aiContent.standout_moments.map((moment, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{moment.moment}</h4>
                          <p className="text-sm text-zinc-400">{moment.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Genres & Moods */}
              <div className="grid md:grid-cols-2 gap-4">
                {stats.genres.length > 0 && (
                  <Card className="bg-zinc-900 border-zinc-800 p-6">
                    <h3 className="text-lg font-bold mb-3">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.genres.map((genre, idx) => (
                        <Badge key={idx} className="bg-zinc-800 text-zinc-300 border-zinc-700">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
                {stats.moods.length > 0 && (
                  <Card className="bg-zinc-900 border-zinc-800 p-6">
                    <h3 className="text-lg font-bold mb-3">Moods</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.moods.slice(0, 8).map((mood, idx) => (
                        <Badge key={idx} className="bg-zinc-800 text-zinc-300 border-zinc-700">
                          {mood}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="mt-6">
              <div className="space-y-4">
                {aiContent.track_analysis?.map((analysis, idx) => {
                  const track = tracks.find(t => t.title === analysis.track_title);
                  return (
                    <Card key={idx} className="bg-zinc-900 border-zinc-800 p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-violet-400">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-2">{analysis.track_title}</h3>
                          <p className="text-zinc-300 mb-3">{analysis.analysis}</p>
                          {analysis.highlights && (
                            <div className="bg-zinc-800/50 rounded-lg p-3">
                              <p className="text-sm text-violet-400 font-semibold mb-1">Production Highlights:</p>
                              <p className="text-sm text-zinc-400">{analysis.highlights}</p>
                            </div>
                          )}
                          {track && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {track.bpm && <Badge className="bg-zinc-800 text-zinc-300">{track.bpm} BPM</Badge>}
                              {track.key && <Badge className="bg-zinc-800 text-zinc-300">{track.key}</Badge>}
                              {track.energy && <Badge className="bg-zinc-800 text-zinc-300">Energy {track.energy}/10</Badge>}
                              {track.duration && <Badge className="bg-zinc-800 text-zinc-300">{formatDuration(track.duration)}</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6 mt-6">
              {/* Similar Albums */}
              {aiContent.complementary_albums?.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">If You Like This Album</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {aiContent.complementary_albums.map((rec, idx) => (
                      <Card key={idx} className="bg-zinc-900 border-zinc-800 p-6 hover:border-violet-500/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <Music2 className="w-8 h-8 text-zinc-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold mb-1">{rec.album}</h4>
                            <p className="text-sm text-violet-400 mb-2">{rec.artist}</p>
                            <p className="text-sm text-zinc-400">{rec.reason}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Artists */}
              {aiContent.similar_artists?.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Similar Artists</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {aiContent.similar_artists.map((artist, idx) => (
                      <Card key={idx} className="bg-zinc-900 border-zinc-800 p-6 hover:border-violet-500/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                            <Music2 className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold">{artist.name}</h4>
                        </div>
                        <p className="text-sm text-zinc-400">{artist.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracks" className="mt-6">
              <div className="space-y-1">
                {tracks.map((track, idx) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    viewMode="list"
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}