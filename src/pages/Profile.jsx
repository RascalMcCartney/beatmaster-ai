import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Music2, Clock, TrendingUp, Disc3, Upload, Sparkles, Loader2, BarChart3, Camera, Instagram, Twitter, Globe, Music, Video, Edit2, Save, X as XIcon, Share2, Users, UserMinus, Code2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ProfileInsights from '@/components/profile/ProfileInsights';
import RecentlyPlayed from '@/components/profile/RecentlyPlayed';
import TopTracks from '@/components/profile/TopTracks';
import SkillsSection from '@/components/profile/SkillsSection';
import { toast } from 'sonner';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    socials: {
      instagram: '',
      twitter: '',
      soundcloud: '',
      spotify: '',
      youtube: '',
      website: ''
    }
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    if (user) {
      setEditForm({
        bio: user.bio || '',
        socials: user.socials || {
          instagram: '',
          twitter: '',
          soundcloud: '',
          spotify: '',
          youtube: '',
          website: ''
        }
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await base44.auth.updateMe({ avatar_url: null });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Avatar removed');
    } catch (error) {
      toast.error('Failed to remove avatar');
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'twitter': return Twitter;
      case 'soundcloud': return Music;
      case 'spotify': return Music2;
      case 'youtube': return Video;
      case 'website': return Globe;
      default: return Globe;
    }
  };

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => base44.entities.Playlist.list('-created_date'),
  });

  const { data: listeningHistory = [] } = useQuery({
    queryKey: ['listeningHistory'],
    queryFn: () => base44.entities.ListeningHistory.list('-played_at', 1000),
  });

  const { data: sharedContent = [] } = useQuery({
    queryKey: ['sharedContent', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.SharedContent.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.UserFollow.filter({ following_email: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.UserFollow.filter({ follower_email: user.email });
    },
    enabled: !!user?.email,
  });

  const unfollowMutation = useMutation({
    mutationFn: (followId) => base44.entities.UserFollow.delete(followId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast.success('Unfollowed');
    },
  });

  // Calculate statistics
  const totalListeningTime = listeningHistory.reduce((acc, h) => acc + (h.duration_played || 0), 0);
  const totalTracks = tracks.length;
  const totalPlaylists = playlists.length;
  const totalUploadedTracks = tracks.filter(t => t.created_by === user?.email).length;

  // Genre statistics
  const genreCount = tracks.reduce((acc, track) => {
    const genre = track.sub_genre || track.genre || 'Unknown';
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});
  const genreData = Object.entries(genreCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Artist statistics
  const artistCount = tracks.reduce((acc, track) => {
    const artist = track.artist || 'Unknown';
    acc[artist] = (acc[artist] || 0) + 1;
    return acc;
  }, {});
  const topArtists = Object.entries(artistCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Track play statistics
  const trackPlayCount = listeningHistory.reduce((acc, h) => {
    acc[h.track_id] = (acc[h.track_id] || 0) + 1;
    return acc;
  }, {});
  const mostPlayedTracks = tracks
    .map(track => ({
      ...track,
      playCount: trackPlayCount[track.id] || 0
    }))
    .filter(t => t.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 10);

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                  />
                </label>
                {user?.avatar_url && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                  >
                    <XIcon className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">{user?.full_name || 'User'}</h1>
              <p className="text-zinc-400">{user?.email}</p>
              {user?.bio && !isEditing && (
                <p className="text-zinc-300 mt-2 text-sm">{user.bio}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  {user?.role || 'User'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  {isEditing ? (
                    <>
                      <XIcon className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
              {!isEditing && user?.socials && (
                <div className="flex items-center gap-2 mt-3">
                  {Object.entries(user.socials).filter(([_, url]) => url).map(([platform, url]) => {
                    const Icon = getSocialIcon(platform);
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Bio</Label>
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Social Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(editForm.socials).map((platform) => {
                      const Icon = getSocialIcon(platform);
                      return (
                        <div key={platform} className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <Input
                            value={editForm.socials[platform]}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              socials: { ...editForm.socials, [platform]: e.target.value }
                            })}
                            placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                            className="bg-zinc-800 border-zinc-700 text-white text-sm"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <Music2 className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{totalTracks}</div>
              <div className="text-sm text-zinc-400">Total Tracks</div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <Disc3 className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{totalPlaylists}</div>
              <div className="text-sm text-zinc-400">Playlists</div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{formatTime(totalListeningTime)}</div>
              <div className="text-sm text-zinc-400">Listening Time</div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{totalUploadedTracks}</div>
              <div className="text-sm text-zinc-400">Uploaded Tracks</div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <Share2 className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{sharedContent.length}</div>
              <div className="text-sm text-zinc-400">Shared</div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{followers.length}</div>
              <div className="text-sm text-zinc-400">Followers</div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900 border-zinc-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-violet-600">
              <Code2 className="w-4 h-4 mr-2" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="shared" className="data-[state=active]:bg-violet-600">
              <Share2 className="w-4 h-4 mr-2" />
              Shared
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-violet-600">
              <Users className="w-4 h-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-violet-600">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-violet-600">
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skills">
            <SkillsSection />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Genre Distribution */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Genre Distribution</h3>
                {genreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}
                        labelStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-zinc-500">
                    No genre data available
                  </div>
                )}
              </Card>

              {/* Top Artists */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Artists</h3>
                {topArtists.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topArtists}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#71717a"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#71717a" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-zinc-500">
                    No artist data available
                  </div>
                )}
              </Card>
            </div>

            {/* Most Played Tracks */}
            <TopTracks tracks={mostPlayedTracks} />

            {/* Playlists */}
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Playlists ({playlists.length})</h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {playlists.map(playlist => (
                    <div
                      key={playlist.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
                        <Disc3 className="w-6 h-6 text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{playlist.name}</h4>
                        <p className="text-sm text-zinc-400">
                          {playlist.track_ids?.length || 0} tracks
                        </p>
                      </div>
                    </div>
                  ))}
                  {playlists.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      No playlists created yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="shared" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Shared Tracks & Playlists</h3>
              {sharedContent.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {sharedContent.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
                          {share.content_type === 'track' ? (
                            <Music2 className="w-5 h-5 text-violet-400" />
                          ) : (
                            <Disc3 className="w-5 h-5 text-fuchsia-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                              {share.content_type}
                            </Badge>
                            <span className="text-xs text-zinc-500">{share.view_count || 0} views</span>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">
                            Shared {new Date(share.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                          onClick={() => {
                            const url = `${window.location.origin}${window.location.pathname}?token=${share.share_token}&type=${share.content_type}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Link copied');
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <Share2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No shared content yet</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Followers */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Followers ({followers.length})</h3>
                {followers.length > 0 ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {followers.map((follower) => (
                        <div
                          key={follower.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {follower.follower_email}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Following since {new Date(follower.created_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No followers yet</p>
                  </div>
                )}
              </Card>

              {/* Following */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Following ({following.length})</h3>
                {following.length > 0 ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {following.map((follow) => (
                        <div
                          key={follow.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {follow.following_name || follow.following_email}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Following since {new Date(follow.created_date).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-700 text-red-400 hover:bg-red-500/10"
                            onClick={() => unfollowMutation.mutate(follow.id)}
                            disabled={unfollowMutation.isPending}
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unfollow
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Not following anyone yet</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <ProfileInsights
              tracks={tracks}
              listeningHistory={listeningHistory}
              playlists={playlists}
            />
          </TabsContent>

          <TabsContent value="history">
            <RecentlyPlayed listeningHistory={listeningHistory} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}