import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music2, Info, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function RecommendationCard({ recommendation, onPlay, onInfo }) {
  const [showExplanation, setShowExplanation] = useState(false);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <Card className="bg-zinc-800/50 border-zinc-700 p-4 hover:border-violet-500/50 transition-all group">
      <div className="flex items-start gap-4">
        {/* Artwork Placeholder */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/30">
          <Sparkles className="w-8 h-8 text-violet-400" />
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate group-hover:text-violet-400 transition-colors">
            {recommendation?.title || 'Unknown Track'}
          </h3>
          <p className="text-sm text-zinc-400 truncate mb-2">
            {recommendation?.artist || 'Unknown Artist'}
            {recommendation?.album && <span className="text-zinc-500"> • {recommendation.album}</span>}
          </p>
          
          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {recommendation.sub_genre && (
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                {recommendation.sub_genre}
              </Badge>
            )}
            {recommendation.bpm && (
              <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                {recommendation.bpm} BPM
              </Badge>
            )}
            {recommendation.key && (
              <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                {recommendation.key}
              </Badge>
            )}
            {recommendation.energy && (
              <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                Energy {recommendation.energy}/10
              </Badge>
            )}
            {recommendation.confidence && (
              <Badge variant="outline" className={cn("border-zinc-600 text-xs", getConfidenceColor(recommendation.confidence))}>
                {recommendation.confidence}% match
              </Badge>
            )}
          </div>

          {/* Explanation */}
          {showExplanation && recommendation.explanation && (
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 mb-2">
              <p className="text-xs text-zinc-300 leading-relaxed">{recommendation.explanation}</p>
              {recommendation.connects_to && (
                <p className="text-xs text-violet-400 mt-2">
                  <strong>Connects to:</strong> {recommendation.connects_to}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-violet-400"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}