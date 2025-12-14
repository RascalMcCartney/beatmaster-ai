import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Music2, UserPlus, UserMinus, Edit, Trash2, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

const ACTION_CONFIG = {
  track_added: {
    icon: Music2,
    color: 'emerald',
    label: 'added',
  },
  track_removed: {
    icon: Trash2,
    color: 'red',
    label: 'removed',
  },
  playlist_edited: {
    icon: Edit,
    color: 'blue',
    label: 'edited',
  },
  collaborator_added: {
    icon: UserPlus,
    color: 'violet',
    label: 'added collaborator',
  },
  collaborator_removed: {
    icon: UserMinus,
    color: 'amber',
    label: 'removed collaborator',
  },
};

export default function ActivityFeed({ playlistId }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['playlist-activity', playlistId],
    queryFn: () => base44.entities.PlaylistActivity.filter(
      { playlist_id: playlistId },
      '-created_date',
      50
    ),
    enabled: !!playlistId,
    refetchInterval: 5000, // Refetch every 5 seconds for near real-time updates
  });

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 pr-4">
      <div className="space-y-3">
        {activities.map((activity) => {
          const config = ACTION_CONFIG[activity.action_type] || ACTION_CONFIG.playlist_edited;
          const Icon = config.icon;
          
          return (
            <div 
              key={activity.id}
              className="flex gap-3 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:bg-zinc-800/50 transition-colors"
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                `bg-${config.color}-500/20`
              )}>
                <Icon className={cn("w-5 h-5", `text-${config.color}-400`)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.user_name || activity.user_email}</span>
                      {' '}
                      <span className="text-zinc-400">{config.label}</span>
                      {activity.track_title && (
                        <>
                          {' '}
                          <span className="text-white font-medium truncate inline-block max-w-[200px] align-bottom">
                            {activity.track_title}
                          </span>
                          {activity.track_artist && (
                            <span className="text-zinc-500"> by {activity.track_artist}</span>
                          )}
                        </>
                      )}
                      {activity.details && !activity.track_title && (
                        <span className="text-zinc-400"> - {activity.details}</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatTimeAgo(activity.created_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}