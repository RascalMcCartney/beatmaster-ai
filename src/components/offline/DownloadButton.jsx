import React, { useState, useEffect } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { offlineStorage } from './offlineStorage';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function DownloadButton({ track, size = 'default', variant = 'ghost', className }) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    checkIfDownloaded();
  }, [track?.id]);

  const checkIfDownloaded = async () => {
    try {
      await offlineStorage.init();
      const offlineTrack = await offlineStorage.getTrack(track.id);
      setIsDownloaded(!!offlineTrack);
    } catch (error) {
      console.error('Failed to check download status:', error);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    
    if (isDownloaded) {
      toast.info('Track already downloaded');
      return;
    }

    setIsDownloading(true);
    try {
      await offlineStorage.init();
      await offlineStorage.downloadTrack(track);
      setIsDownloaded(true);
      toast.success('Track downloaded for offline use');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download track');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(
        isDownloaded && "text-emerald-400 hover:text-emerald-300",
        className
      )}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isDownloaded ? (
        <Check className="w-4 h-4" />
      ) : (
        <Download className="w-4 h-4" />
      )}
    </Button>
  );
}