import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Download, Trash2, Music2, Disc3, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { offlineStorage } from '@/components/offline/offlineStorage';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function Offline() {
  const [offlineTracks, setOfflineTracks] = useState([]);
  const [offlinePlaylists, setOfflinePlaylists] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initOfflineStorage();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initOfflineStorage = async () => {
    try {
      await offlineStorage.init();
      await loadOfflineContent();
      await loadStorageInfo();
    } catch (error) {
      console.error('Failed to init offline storage:', error);
      toast.error('Failed to load offline content');
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineContent = async () => {
    const tracks = await offlineStorage.getAllTracks();
    const playlists = await offlineStorage.getAllPlaylists();
    setOfflineTracks(tracks);
    setOfflinePlaylists(playlists);
  };

  const loadStorageInfo = async () => {
    const info = await offlineStorage.getStorageSize();
    setStorageInfo(info);
  };

  const handleDeleteTrack = async (trackId) => {
    try {
      await offlineStorage.deleteTrack(trackId);
      await loadOfflineContent();
      await loadStorageInfo();
      toast.success('Track removed from offline storage');
    } catch (error) {
      toast.error('Failed to delete track');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await offlineStorage.deletePlaylist(playlistId);
      await loadOfflineContent();
      await loadStorageInfo();
      toast.success('Playlist removed from offline storage');
    } catch (error) {
      toast.error('Failed to delete playlist');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Offline Content</h1>
              <p className="text-zinc-400">Manage your downloaded tracks and playlists</p>
            </div>
            <Badge className={cn(
              "flex items-center gap-2 px-4 py-2",
              isOnline 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            )}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Storage Info */}
          {storageInfo && (
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-center gap-4 mb-3">
                <HardDrive className="w-5 h-5 text-violet-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Storage Usage</span>
                    <span className="text-zinc-400 text-sm">
                      {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                    </span>
                  </div>
                  <Progress value={storageInfo.percentage} className="h-2" />
                </div>
                <span className="text-violet-400 font-mono font-bold">
                  {storageInfo.percentage.toFixed(1)}%
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <Music2 className="w-8 h-8 text-violet-400" />
              <div>
                <div className="text-2xl font-bold text-white">{offlineTracks.length}</div>
                <div className="text-sm text-zinc-400">Offline Tracks</div>
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <Disc3 className="w-8 h-8 text-fuchsia-400" />
              <div>
                <div className="text-2xl font-bold text-white">{offlinePlaylists.length}</div>
                <div className="text-sm text-zinc-400">Offline Playlists</div>
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <Download className="w-8 h-8 text-emerald-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {formatBytes(storageInfo?.usage || 0)}
                </div>
                <div className="text-sm text-zinc-400">Total Size</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Offline Tracks */}
        <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Downloaded Tracks</h2>
          {offlineTracks.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {offlineTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {track.artworkBlob ? (
                        <img 
                          src={URL.createObjectURL(track.artworkBlob)} 
                          alt={track.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                          <Music2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
                      <p className="text-xs text-zinc-500 truncate">{track.artist || 'Unknown Artist'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDeleteTrack(track.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <Download className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No offline tracks yet</p>
              <p className="text-xs mt-1">Download tracks to play them offline</p>
            </div>
          )}
        </Card>

        {/* Offline Playlists */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Downloaded Playlists</h2>
          {offlinePlaylists.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {offlinePlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
                      <Disc3 className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{playlist.name}</h4>
                      <p className="text-xs text-zinc-500">{playlist.track_ids?.length || 0} tracks</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDeletePlaylist(playlist.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <Download className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No offline playlists yet</p>
              <p className="text-xs mt-1">Download playlists to access them offline</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}