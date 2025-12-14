import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Edit3 } from 'lucide-react';

export default function BulkEditModal({ open, onOpenChange, selectedTracks, onSave }) {
  const [saving, setSaving] = useState(false);
  const [updateFields, setUpdateFields] = useState({
    genre: false,
    sub_genre: false,
    mood: false,
    energy: false,
    track_type: false,
  });
  const [formData, setFormData] = useState({
    genre: '',
    sub_genre: '',
    mood: '',
    energy: 5,
    track_type: '',
  });

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    Object.keys(updateFields).forEach(field => {
      if (updateFields[field]) {
        updates[field] = formData[field];
      }
    });
    await onSave(updates);
    setSaving(false);
    onOpenChange(false);
  };

  const hasUpdates = Object.values(updateFields).some(v => v);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-violet-400" />
            Bulk Edit {selectedTracks.length} Tracks
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Genre */}
          <div className="flex items-start gap-3">
            <Checkbox
              checked={updateFields.genre}
              onCheckedChange={(checked) => setUpdateFields({...updateFields, genre: checked})}
              className="mt-2"
            />
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-300">Genre</Label>
              <Input
                value={formData.genre}
                onChange={(e) => setFormData({...formData, genre: e.target.value})}
                placeholder="e.g., Electronic, Hip-Hop"
                disabled={!updateFields.genre}
                className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Sub-Genre */}
          <div className="flex items-start gap-3">
            <Checkbox
              checked={updateFields.sub_genre}
              onCheckedChange={(checked) => setUpdateFields({...updateFields, sub_genre: checked})}
              className="mt-2"
            />
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-300">Sub-Genre</Label>
              <Input
                value={formData.sub_genre}
                onChange={(e) => setFormData({...formData, sub_genre: e.target.value})}
                placeholder="e.g., deep house, tech house"
                disabled={!updateFields.sub_genre}
                className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Mood */}
          <div className="flex items-start gap-3">
            <Checkbox
              checked={updateFields.mood}
              onCheckedChange={(checked) => setUpdateFields({...updateFields, mood: checked})}
              className="mt-2"
            />
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-300">Mood</Label>
              <Input
                value={formData.mood}
                onChange={(e) => setFormData({...formData, mood: e.target.value})}
                placeholder="e.g., energetic, chill, dark"
                disabled={!updateFields.mood}
                className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Energy */}
          <div className="flex items-start gap-3">
            <Checkbox
              checked={updateFields.energy}
              onCheckedChange={(checked) => setUpdateFields({...updateFields, energy: checked})}
              className="mt-2"
            />
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-300">Energy Level (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.energy}
                onChange={(e) => setFormData({...formData, energy: parseInt(e.target.value)})}
                disabled={!updateFields.energy}
                className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Track Type */}
          <div className="flex items-start gap-3">
            <Checkbox
              checked={updateFields.track_type}
              onCheckedChange={(checked) => setUpdateFields({...updateFields, track_type: checked})}
              className="mt-2"
            />
            <div className="flex-1 space-y-2">
              <Label className="text-zinc-300">Track Type</Label>
              <Select
                value={formData.track_type}
                onValueChange={(value) => setFormData({...formData, track_type: value})}
                disabled={!updateFields.track_type}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="instrumental">Instrumental</SelectItem>
                  <SelectItem value="vocal">Vocal</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUpdates || saving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              `Update ${selectedTracks.length} Tracks`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}