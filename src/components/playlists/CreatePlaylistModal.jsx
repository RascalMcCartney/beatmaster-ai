import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import SmartPlaylistConfig from './SmartPlaylistConfig';

export default function CreatePlaylistModal({ 
  open, 
  onOpenChange, 
  onSave, 
  editPlaylist = null 
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isSmartPlaylist, setIsSmartPlaylist] = useState(false);
  const [smartCriteria, setSmartCriteria] = useState(null);
  const [smartConfigOpen, setSmartConfigOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file) => base44.integrations.Core.UploadFile({ file }),
  });

  useEffect(() => {
    if (open) {
      if (editPlaylist) {
        setName(editPlaylist.name || '');
        setDescription(editPlaylist.description || '');
        setCoverPreview(editPlaylist.cover_url || null);
        setIsSmartPlaylist(editPlaylist.is_smart || false);
        setSmartCriteria(editPlaylist.smart_criteria || null);
      } else {
        setName('');
        setDescription('');
        setCoverFile(null);
        setCoverPreview(null);
        setIsSmartPlaylist(false);
        setSmartCriteria(null);
      }
    }
  }, [editPlaylist, open]);

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setSaving(true);

    try {
      let coverUrl = editPlaylist?.cover_url;

      // Upload cover if new file selected
      if (coverFile) {
        const result = await uploadMutation.mutateAsync(coverFile);
        coverUrl = result.file_url;
      }

      await onSave({ 
        name: name.trim(), 
        description: description.trim(),
        cover_url: coverUrl,
        is_smart: isSmartPlaylist,
        smart_criteria: isSmartPlaylist ? smartCriteria : null,
        track_ids: editPlaylist?.track_ids || []
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save playlist');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editPlaylist ? 'Edit Playlist' : 'Create Playlist'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Playlist"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
                rows={3}
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Cover Image (optional)</Label>
              <div className="flex items-center gap-4">
                {coverPreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    onClick={(e) => {
                      e.preventDefault();
                      e.currentTarget.previousElementSibling.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {coverPreview ? 'Change Cover' : 'Upload Cover'}
                  </Button>
                </label>
              </div>
            </div>

            {/* Smart Playlist Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <Label className="text-white font-medium">Smart Playlist</Label>
                  <p className="text-xs text-zinc-500">Auto-update based on rules</p>
                </div>
              </div>
              <Switch
                checked={isSmartPlaylist}
                onCheckedChange={setIsSmartPlaylist}
              />
            </div>

            {/* Configure Smart Rules */}
            {isSmartPlaylist && (
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                onClick={() => setSmartConfigOpen(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {smartCriteria ? 'Edit Rules' : 'Configure Rules'}
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editPlaylist ? 'Save Changes' : 'Create Playlist'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SmartPlaylistConfig
        open={smartConfigOpen}
        onOpenChange={setSmartConfigOpen}
        onSave={setSmartCriteria}
        initialCriteria={smartCriteria}
      />
    </>
  );
}