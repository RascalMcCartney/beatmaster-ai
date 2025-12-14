import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music2, Loader2, Merge, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Helper function for string similarity
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = (s1, s2) => {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

export default function DuplicateTracksModal({ open, onOpenChange, tracks, onMerge }) {
  const [merging, setMerging] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState(new Set());

  // Find potential duplicates based on title and artist similarity
  const duplicateGroups = useMemo(() => {
    const groups = [];
    const processed = new Set();

    tracks.forEach((track, index) => {
      if (processed.has(track.id)) return;

      const duplicates = tracks
        .slice(index + 1)
        .filter(t => {
          if (processed.has(t.id)) return false;

          const titleMatch = track.title?.toLowerCase() === t.title?.toLowerCase();
          const artistMatch = track.artist?.toLowerCase() === t.artist?.toLowerCase();
          
          // Fuzzy match on title (70% similarity)
          const titleSimilarity = titleMatch || (
            track.title && t.title &&
            calculateSimilarity(track.title.toLowerCase(), t.title.toLowerCase()) > 0.7
          );

          return titleSimilarity && (artistMatch || !track.artist || !t.artist);
        });

      if (duplicates.length > 0) {
        const group = [track, ...duplicates];
        groups.push(group);
        group.forEach(t => processed.add(t.id));
      }
    });

    return groups;
  }, [tracks]);

  const handleMerge = async (group) => {
    setMerging(true);
    
    // Keep the first track (usually the oldest/best analyzed)
    const primaryTrack = group[0];
    const duplicatesToDelete = group.slice(1);

    // Merge metadata - prefer non-null values from any track
    const mergedData = { ...primaryTrack };
    group.forEach(track => {
      Object.keys(track).forEach(key => {
        if (track[key] && !mergedData[key]) {
          mergedData[key] = track[key];
        }
      });
    });

    try {
      await onMerge(primaryTrack.id, mergedData, duplicatesToDelete.map(t => t.id));
      toast.success(`Merged ${duplicatesToDelete.length + 1} duplicate tracks`);
      setSelectedDuplicates(prev => {
        const newSet = new Set(prev);
        group.forEach(t => newSet.delete(t.id));
        return newSet;
      });
    } catch (error) {
      toast.error('Failed to merge tracks');
    }

    setMerging(false);
  };

  const handleMergeAll = async () => {
    setMerging(true);
    for (const group of duplicateGroups) {
      await handleMerge(group);
    }
    setMerging(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Merge className="w-5 h-5 text-amber-400" />
            Duplicate Tracks ({duplicateGroups.length} groups found)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto max-h-[60vh]">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No duplicate tracks found</p>
            </div>
          ) : (
            duplicateGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-zinc-400">
                      {group.length} duplicates
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMerge(group)}
                    disabled={merging}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <Merge className="w-3 h-3 mr-1" />
                    Merge
                  </Button>
                </div>

                <div className="space-y-2">
                  {group.map((track, index) => (
                    <div 
                      key={track.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50"
                    >
                      {index === 0 && (
                        <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                          Primary
                        </Badge>
                      )}
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
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
                        <p className="text-xs text-zinc-500 truncate">{track.artist || 'Unknown'}</p>
                      </div>
                      <div className="flex gap-2">
                        {track.bpm && (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                            {track.bpm} BPM
                          </Badge>
                        )}
                        {track.analysis_status === 'complete' && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            Analyzed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
          >
            Close
          </Button>
          {duplicateGroups.length > 0 && (
            <Button
              onClick={handleMergeAll}
              disabled={merging}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {merging ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                `Merge All ${duplicateGroups.length} Groups`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}