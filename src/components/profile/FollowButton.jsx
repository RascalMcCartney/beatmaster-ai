import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export default function FollowButton({ targetUser }) {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: followRecord } = useQuery({
    queryKey: ['follow', currentUser?.email, targetUser.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const records = await base44.entities.UserFollow.filter({
        follower_email: currentUser.email,
        following_email: targetUser.email
      });
      return records[0] || null;
    },
    enabled: !!currentUser?.email && currentUser.email !== targetUser.email,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (followRecord) {
        await base44.entities.UserFollow.delete(followRecord.id);
      } else {
        await base44.entities.UserFollow.create({
          follower_email: currentUser.email,
          following_email: targetUser.email,
          following_name: targetUser.full_name
        });

        // Create notification
        await base44.entities.Notification.create({
          recipient_email: targetUser.email,
          type: 'follow',
          actor_email: currentUser.email,
          actor_name: currentUser.full_name,
          content_type: 'user',
          message: 'started following you',
          action_url: '/Profile'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow'] });
      toast.success(followRecord ? 'Unfollowed' : 'Following');
    },
  });

  if (!currentUser || currentUser.email === targetUser.email) {
    return null;
  }

  return (
    <Button
      onClick={() => followMutation.mutate()}
      disabled={followMutation.isPending}
      variant={followRecord ? 'outline' : 'default'}
      className={followRecord 
        ? "bg-transparent border-zinc-700 text-white hover:bg-zinc-800" 
        : "bg-violet-600 hover:bg-violet-700"
      }
    >
      {followRecord ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}