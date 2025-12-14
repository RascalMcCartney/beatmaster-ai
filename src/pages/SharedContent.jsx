import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Music2, Play, Clock, Zap, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function SharedContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const contentType = urlParams.get('type');

  const { data: sharedData } = useQuery({
    queryKey: ['shared-content', token],
    queryFn: async () => {
      const shares = await base44.entities.SharedContent.filter({ share_token: token });
      return shares[0];
    },
    enabled: !!token,
  });

  const { data: content } = useQuery({
    queryKey: ['content', contentType, sharedData?.content_id],
    queryFn: async () => {
      if (contentType === 'track') {
        const tracks = await base44.entities.Track.filter({ id: sharedData.content_id });
        return tracks[0];
      } else {
        const playlists = await base44.entities.Playlist.filter({ id: sharedData.content_id });
        return playlists[0];
      }
    },
    enabled: !!sharedData?.content_id,
  });

  const { data: playlistTracks = [] } = useQuery({
    queryKey: ['playlist-tracks', content?.id],
    queryFn: async () => {
      const allTracks = await base44.entities.Track.list();
      return allTracks.filter(t => (content.track_ids || []).includes(t.id));
    },
    enabled: contentType === 'playlist' && !!content?.track_ids,
  });

  const incrementViewMutation = useMutation({
    mutationFn: () => 
      base44.entities.SharedContent.update(sharedData.id, {
        view_count: (sharedData.view_count || 0) + 1
      }),
  });

  useEffect(() => {
    if (sharedData) {
      incrementViewMutation.mutate();
    }
  }, [sharedData?.id]);

  if (!token || !contentType) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Music2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Share Link</h2>
          <p className="text-zinc-400 mb-6">This link is not valid or has expired</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {contentType === 'track' ? (
          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800">
            <div className="flex gap-6 mb-8">
              <div className="w-48 h-48 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl">
                {content.artwork_url ? (
                  <img src={content.artwork_url} alt={content.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    <Music2 className="w-20 h-20 text-white/50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-violet-400 mb-2 uppercase tracking-wider">Shared Track</div>
                <h1 className="text-4xl font-bold text-white mb-2">{content.title}</h1>
                <p className="text-xl text-zinc-400 mb-4">{content.artist || 'Unknown Artist'}</p>
                {content.album && <p className="text-zinc-500 mb-4">{content.album}</p>}
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {content.genre && (
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                      {content.genre}
                    </Badge>
                  )}
                  {content.bpm && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {content.bpm} BPM
                    </Badge>
                  )}
                  {content.key && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      {content.key}
                    </Badge>
                  )}
                  {content.energy && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      <Zap className="w-3 h-3 mr-1" />
                      Energy {content.energy}/10
                    </Badge>
                  )}
                </div>

                {content.audio_url && (
                  <audio controls className="w-full">
                    <source src={content.audio_url} />
                  </audio>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800">
              <div className="flex gap-6">
                <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl">
                  {content.cover_url ? (
                    <img src={content.cover_url} alt={content.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                      <Music2 className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-violet-400 mb-2 uppercase tracking-wider">Shared Playlist</div>
                  <h1 className="text-3xl font-bold text-white mb-2">{content.name}</h1>
                  {content.description && <p className="text-zinc-400 mb-4">{content.description}</p>}
                  <p className="text-zinc-500">{playlistTracks.length} tracks</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold text-white mb-4">Tracks</h2>
              <div className="space-y-2">
                {playlistTracks.map((track, index) => (
                  <div key={track.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                    <span className="text-sm text-zinc-500 w-6">{index + 1}</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      {track.artwork_url ? (
                        <img src={track.artwork_url} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                          <Music2 className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
                      <p className="text-xs text-zinc-500 truncate">{track.artist || 'Unknown Artist'}</p>
                    </div>
                    {track.duration && (
                      <span className="text-xs text-zinc-500">
                        {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View count */}
        <div className="text-center mt-8 text-zinc-600 text-sm">
          {sharedData?.view_count || 0} view{(sharedData?.view_count || 0) !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}