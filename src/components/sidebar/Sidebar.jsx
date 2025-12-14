import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Library, FolderOpen, Plus, Music2, Disc3, Sparkles, Mic2, TrendingUp, ListMusic, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const NAV_CATEGORIES = [
  {
    label: 'Browse',
    items: [
      { icon: Home, label: 'Home', page: 'Home' },
      { icon: Library, label: 'Library', page: 'Library' },
      { icon: TrendingUp, label: 'Discover', page: 'Discover' },
    ]
  },
  {
    label: 'Collections',
    items: [
      { icon: FolderOpen, label: 'Playlists', page: 'Playlists' },
      { icon: ListMusic, label: 'Setlists', page: 'Setlists' },
      { icon: Mic2, label: 'Recordings', page: 'Recordings' },
      { icon: Download, label: 'Offline', page: 'Offline' },
    ]
  },
  {
    label: 'Performance',
    items: [
      { icon: Disc3, label: 'DJ Mode', page: 'DJMode' },
      { icon: Sparkles, label: 'Auto-DJ', page: 'AutoDJ' },
    ]
  }
];

function CategorySection({ category, currentPage }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-400 transition-colors">
        {category.label}
        {isOpen ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        {category.items.map(({ icon: Icon, label, page }) => (
          <Link
            key={page}
            to={createPageUrl(page)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
              currentPage === page
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Sidebar({ 
  playlists = [], 
  currentPage, 
  onCreatePlaylist,
  selectedPlaylistId 
}) {
  return (
    <aside className="w-64 h-full bg-zinc-950 border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
          <Music2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">SoundLab</span>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-4">
        {NAV_CATEGORIES.map((category) => (
          <CategorySection
            key={category.label}
            category={category}
            currentPage={currentPage}
          />
        ))}
      </nav>

      {/* Playlists */}
      <div className="mt-8 flex-1 flex flex-col min-h-0">
        <div className="px-6 flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Playlists
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-zinc-400 hover:text-white"
            onClick={onCreatePlaylist}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-6">
            {playlists.map(playlist => (
              <Link
                key={playlist.id}
                to={createPageUrl(`Playlists?id=${playlist.id}`)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                  selectedPlaylistId === playlist.id
                    ? "bg-violet-500/20 text-violet-400"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-4 h-4 text-zinc-500" />
                </div>
                <span className="truncate text-sm">{playlist.name}</span>
              </Link>
            ))}
            
            {playlists.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No playlists yet
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}