// IndexedDB wrapper for offline storage
const DB_NAME = 'BeatMasterOffline';
const DB_VERSION = 1;
const TRACKS_STORE = 'tracks';
const PLAYLISTS_STORE = 'playlists';

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(TRACKS_STORE)) {
          db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
          db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  async downloadTrack(track) {
    if (!track.audio_url) throw new Error('No audio URL');

    const response = await fetch(track.audio_url);
    const blob = await response.blob();

    let artworkBlob = null;
    if (track.artwork_url) {
      try {
        const artResponse = await fetch(track.artwork_url);
        artworkBlob = await artResponse.blob();
      } catch (e) {
        console.warn('Failed to download artwork:', e);
      }
    }

    const offlineTrack = {
      ...track,
      audioBlob: blob,
      artworkBlob: artworkBlob,
      downloadedAt: new Date().toISOString(),
    };

    const transaction = this.db.transaction([TRACKS_STORE], 'readwrite');
    const store = transaction.objectStore(TRACKS_STORE);
    await store.put(offlineTrack);

    return offlineTrack;
  }

  async downloadPlaylist(playlist, tracks) {
    const offlinePlaylist = {
      ...playlist,
      downloadedAt: new Date().toISOString(),
    };

    // Download all tracks
    const downloadPromises = tracks.map(track => this.downloadTrack(track));
    await Promise.all(downloadPromises);

    const transaction = this.db.transaction([PLAYLISTS_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    await store.put(offlinePlaylist);

    return offlinePlaylist;
  }

  async getTrack(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([TRACKS_STORE], 'readonly');
      const store = transaction.objectStore(TRACKS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTracks() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([TRACKS_STORE], 'readonly');
      const store = transaction.objectStore(TRACKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPlaylists() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PLAYLISTS_STORE], 'readonly');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTrack(id) {
    const transaction = this.db.transaction([TRACKS_STORE], 'readwrite');
    const store = transaction.objectStore(TRACKS_STORE);
    await store.delete(id);
  }

  async deletePlaylist(id) {
    const transaction = this.db.transaction([PLAYLISTS_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYLISTS_STORE);
    await store.delete(id);
  }

  async getStorageSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: (estimate.usage / estimate.quota) * 100,
      };
    }
    return null;
  }
}

export const offlineStorage = new OfflineStorage();