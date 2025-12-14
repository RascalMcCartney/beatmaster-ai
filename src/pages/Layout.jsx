
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/sidebar/Sidebar';
import CreatePlaylistModal from '@/components/playlists/CreatePlaylistModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Github, Linkedin } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [betaBannerVisible, setBetaBannerVisible] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlaylistId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: playlists = [], refetch } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => base44.entities.Playlist.list('-created_date')
  });

  const handleCreatePlaylist = async (data) => {
    await base44.entities.Playlist.create(data);
    refetch();
    toast.success('Playlist created');
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.
    split(' ').
    map((n) => n[0]).
    join('').
    toUpperCase().
    slice(0, 2);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setBetaBannerVisible(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        :root {
          --background: 9 9 11;
          --foreground: 250 250 250;
          --card: 24 24 27;
          --card-foreground: 250 250 250;
          --popover: 24 24 27;
          --popover-foreground: 250 250 250;
          --primary: 139 92 246;
          --primary-foreground: 255 255 255;
          --secondary: 39 39 42;
          --secondary-foreground: 250 250 250;
          --muted: 39 39 42;
          --muted-foreground: 161 161 170;
          --accent: 39 39 42;
          --accent-foreground: 250 250 250;
          --destructive: 239 68 68;
          --destructive-foreground: 255 255 255;
          --border: 39 39 42;
          --input: 39 39 42;
          --ring: 139 92 246;
        }
        
        body {
          background: rgb(var(--background));
          color: rgb(var(--foreground));
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgb(63 63 70);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgb(82 82 91);
        }

        /* Slider Track */
        [data-orientation="horizontal"] > span[data-orientation="horizontal"] {
          background: rgb(63 63 70);
        }

        [data-orientation="horizontal"] > span > span {
          background: rgb(139 92 246);
        }
        `}</style>

        {/* Top Bar */}
        <div className="h-16 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}>

              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6933fc08ab342a0fdfb70f22/cc9b1301b_Colorlogo-nobackground.png"
                  alt="Logo"
                  className="h-8 w-auto cursor-pointer animate-pulse" />

                </PopoverTrigger>
                <PopoverContent className="w-80 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/50 border border-violet-500/20 p-4 rounded-2xl shadow-2xl shadow-violet-500/20" align="start" sideOffset={12}>
                  <div className="absolute -top-2 left-8 w-4 h-4 rotate-45 bg-gradient-to-br from-zinc-900 to-violet-950/50 border-l border-t border-violet-500/20" />
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-white mb-1">Adam McCartney</h4>
                      <p className="text-sm text-zinc-400">Software Engineering Technical Lead</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <a
                      href="mailto:adam@mccartn3y.net"
                      className="flex items-center gap-2 text-zinc-300 hover:text-violet-400 transition-colors">

                        <Mail className="w-4 h-4" />
                        <span>adam@mccartn3y.net</span>
                      </a>
                      <a
                      href="https://github.com/RascalMcCartney"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-zinc-300 hover:text-violet-400 transition-colors">

                        <Github className="w-4 h-4" />
                        <span>github.com/RascalMcCartney</span>
                      </a>
                      <a
                      href="https://www.linkedin.com/in/adam-mccartney/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-zinc-300 hover:text-violet-400 transition-colors">

                        <Linkedin className="w-4 h-4" />
                        <span>linkedin.com/in/adam-mccartney</span>
                      </a>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6933fc08ab342a0fdfb70f22/2af494f46_beatmaster_gen_2.png"
              alt="BeatMaster"
              className="h-10 w-auto"
            />
          </div>

          <OfflineIndicator />

          <NotificationBell user={user} />

          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                {user?.avatar_url ?
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-full" /> :

                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-semibold">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                }
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                {user?.avatar_url ?
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-full" /> :

                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-xs">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                }
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <Link to={createPageUrl('Profile')}>
              <DropdownMenuItem className="text-white cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="text-white cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        {/* Beta Banner */}
        {betaBannerVisible && (
          <div className="bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-fuchsia-500/10 border-b border-amber-500/20 px-6 py-3">
            <div className="flex items-center justify-center gap-2 text-sm relative">
              <span className="text-2xl">🚧</span>
              <p className="text-amber-200/90">
                <span className="font-semibold">Beta Vibes Only!</span> Things might get a little funky while we're tuning the mix. If something breaks, that's just part of the creative process... right? 
              </p>
              <span className="text-2xl">🎧</span>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 h-6 w-6 text-amber-200/60 hover:text-amber-200 hover:bg-amber-500/20"
                onClick={() => setBetaBannerVisible(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0">

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-64 h-full sticky top-0">
        <Sidebar
            playlists={playlists}
            currentPage={currentPageName}
            onCreatePlaylist={() => setCreateOpen(true)}
            selectedPlaylistId={selectedPlaylistId} />

      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen &&
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)} />

          <div className="fixed left-0 top-0 h-screen w-64 z-50 lg:hidden">
            <Sidebar
              playlists={playlists}
              currentPage={currentPageName}
              onCreatePlaylist={() => {
                setCreateOpen(true);
                setSidebarOpen(false);
              }}
              selectedPlaylistId={selectedPlaylistId} />

          </div>
        </>
        }

      {/* Main Content */}
      <main className="flex-1 min-h-0">
        {children}
      </main>
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreatePlaylist} />

      </div>);

}
