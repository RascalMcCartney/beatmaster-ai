import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Music2, Disc3, Play, Sparkles, Users, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import TrackCard from '@/components/tracks/TrackCard';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Artist() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const artistName = urlParams.get('name');

  const [aiContent, setAiContent] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks', artistName],
    queryFn: () => base44.entities.Track.filter({ artist: artistName }),
    enabled: !!artistName
  });

  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list()
  });

  useEffect(() => {
    if (artistName && tracks.length > 0) {
      generateAIContent();
    }
  }, [artistName, tracks.length]);

  const generateAIContent = async () => {
    setLoadingAI(true);
    try {
      const trackList = tracks.map(t => ({
        title: t.title,
        genre: t.genre,
        bpm: t.bpm,
        energy: t.energy,
        mood: t.mood
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a music journalist and curator with deep knowledge of electronic music, DJs, and producers.

Analyze the artist "${artistName}" based on their tracks:
${JSON.stringify(trackList, null, 2)}

Provide:

1. ARTIST BIOGRAPHY:
   - Write a compelling 2-3 paragraph biography
   - Include their musical style, influences, and impact
   - Be specific to electronic music and DJ culture
   - Make it sound professional and engaging

2. SIMILAR ARTISTS:
   - Suggest 5-8 similar artists/DJs in the same genre
   - Include brief 1-sentence descriptions of why they're similar
   - Focus on real artists in the electronic music scene

3. FEATURED TRACKS:
   - From the provided tracks, identify the 3-5 most significant ones
   - Explain why each track stands out (production quality, energy, mixing potential, etc.)
   - Provide track titles exactly as they appear in the data

4. STYLE ANALYSIS:
   - Describe their signature sound and production techniques
   - Identify common elements across their tracks
   - Highlight what makes them unique

5. CAREER HIGHLIGHTS:
   - Notable releases, performances, or achievements (be creative but realistic)
   - Genre innovations or contributions`,
        response_json_schema: {
          type: "object",
          properties: {
            biography: { type: "string" },
            similar_artists: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            featured_tracks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            style_analysis: { type: "string" },
            career_highlights: {
              type: "array",
              items: { type: "string" }
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
    avgBPM: Math.round(tracks.reduce((sum, t) => sum + (t.bpm || 0), 0) / tracks.length),
    avgEnergy: (tracks.reduce((sum, t) => sum + (t.energy || 0), 0) / tracks.length).toFixed(1),
    genres: [...new Set(tracks.map(t => t.genre).filter(Boolean))],
    albums: [...new Set(tracks.map(t => t.album).filter(Boolean))]
  };

  if (!artistName) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">
        <p>No artist selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-b from-violet-600/20 to-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950" />
        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Library'))}
            className="absolute top-4 left-4 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-6xl font-black mb-2">{artistName}</h1>
          <p className="text-zinc-400 text-lg">Artist Profile</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <Music2 className="w-5 h-5 text-violet-400" />
              <div>
                <div className="text-2xl font-bold">{stats.totalTracks}</div>
                <div className="text-xs text-zinc-500">Tracks</div>
              </div>
            </div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <Disc3 className="w-5 h-5 text-fuchsia-400" />
              <div>
                <div className="text-2xl font-bold">{stats.albums.length}</div>
                <div className="text-xs text-zinc-500">Albums</div>
              </div>
            </div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-2xl font-bold">{stats.avgBPM}</div>
                <div className="text-xs text-zinc-500">Avg BPM</div>
              </div>
            </div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold">{stats.avgEnergy}</div>
                <div className="text-xs text-zinc-500">Avg Energy</div>
              </div>
            </div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold">{stats.genres.length}</div>
                <div className="text-xs text-zinc-500">Genres</div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Content Loading */}
        {loadingAI && (
          <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              <span className="text-zinc-400">Generating AI insights...</span>
            </div>
          </Card>
        )}

        {/* AI Generated Content */}
        {aiContent && (
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="bg-zinc-900 border-b border-zinc-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="similar">Similar Artists</TabsTrigger>
              <TabsTrigger value="featured">Featured Tracks</TabsTrigger>
              <TabsTrigger value="tracks">All Tracks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Biography */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h2 className="text-xl font-bold">Biography</h2>
                  <Badge className="bg-violet-500/20 text-violet-400 border-0">AI Generated</Badge>
                </div>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{aiContent.biography}</p>
              </Card>

              {/* Style Analysis */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-lg font-bold mb-3">Style Analysis</h3>
                <p className="text-zinc-300 leading-relaxed">{aiContent.style_analysis}</p>
              </Card>

              {/* Career Highlights */}
              {aiContent.career_highlights?.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <h3 className="text-lg font-bold mb-3">Career Highlights</h3>
                  <ul className="space-y-2">
                    {aiContent.career_highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-300">
                        <span className="text-violet-400 mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Genres */}
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
            </TabsContent>

            <TabsContent value="similar" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {aiContent.similar_artists?.map((artist, idx) => (
                  <Card key={idx} className="bg-zinc-900 border-zinc-800 p-6 hover:border-violet-500/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{artist.name}</h3>
                        <p className="text-sm text-zinc-400">{artist.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="featured" className="mt-6">
              <div className="space-y-4">
                {aiContent.featured_tracks?.map((featuredTrack, idx) => {
                  const track = tracks.find(t => t.title === featuredTrack.title);
                  return (
                    <Card key={idx} className="bg-zinc-900 border-zinc-800 p-6">
                      <div className="flex items-start gap-4">
                        {track?.artwork_url ? (
                          <img src={track.artwork_url} alt={track.title} className="w-20 h-20 rounded-lg object-cover" />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <Music2 className="w-8 h-8 text-zinc-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1">{featuredTrack.title}</h3>
                          <p className="text-sm text-zinc-400 mb-3">{featuredTrack.reason}</p>
                          {track && (
                            <div className="flex flex-wrap gap-2">
                              {track.bpm && <Badge className="bg-zinc-800 text-zinc-300">{track.bpm} BPM</Badge>}
                              {track.key && <Badge className="bg-zinc-800 text-zinc-300">{track.key}</Badge>}
                              {track.energy && <Badge className="bg-zinc-800 text-zinc-300">Energy {track.energy}/10</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="tracks" className="mt-6">
              <div className="space-y-1">
                {tracks.map(track => (
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

        {/* Albums */}
        {stats.albums.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Albums</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {stats.albums.map((album, idx) => (
                <Card
                  key={idx}
                  className="bg-zinc-900 border-zinc-800 p-4 hover:border-violet-500/50 transition-colors cursor-pointer"
                  onClick={() => navigate(createPageUrl('Album') + `?name=${encodeURIComponent(album)}&artist=${encodeURIComponent(artistName)}`)}
                >
                  <div className="aspect-square bg-zinc-800 rounded-lg mb-3 flex items-center justify-center">
                    <Disc3 className="w-12 h-12 text-zinc-600" />
                  </div>
                  <h3 className="font-bold truncate">{album}</h3>
                  <p className="text-sm text-zinc-500">
                    {tracks.filter(t => t.album === album).length} tracks
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}