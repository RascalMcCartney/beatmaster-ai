import React from 'react';
import { UserPlus, Share2, Users, Music2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const notificationIcons = {
  follow: UserPlus,
  share: Share2,
  playlist_activity: Music2,
  collaborator_added: Users,
};

const notificationColors = {
  follow: 'text-violet-400',
  share: 'text-blue-400',
  playlist_activity: 'text-amber-400',
  collaborator_added: 'text-emerald-400',
};

export default function NotificationItem({ notification, onClick }) {
  const navigate = useNavigate();
  const Icon = notificationIcons[notification.type] || Music2;
  const iconColor = notificationColors[notification.type] || 'text-zinc-400';

  const handleClick = () => {
    onClick?.();
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const timeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return format(notificationDate, 'MMM d');
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-zinc-800/50 cursor-pointer transition-colors",
        !notification.is_read && "bg-violet-500/5"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        notification.is_read ? "bg-zinc-800" : "bg-violet-500/20"
      )}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-relaxed",
          notification.is_read ? "text-zinc-400" : "text-white"
        )}>
          <span className="font-semibold">{notification.actor_name}</span>
          {' '}
          {notification.message}
          {notification.content_title && (
            <span className="text-violet-400"> "{notification.content_title}"</span>
          )}
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          {timeAgo(notification.created_date)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-2" />
      )}
    </div>
  );
}