// Camelot Wheel mapping for harmonic mixing
// https://en.wikipedia.org/wiki/Camelot_Wheel

const CAMELOT_TO_KEY = {
  '1A': 'A♭ Minor',
  '1B': 'B Major',
  '2A': 'E♭ Minor',
  '2B': 'F♯ Major',
  '3A': 'B♭ Minor',
  '3B': 'D♭ Major',
  '4A': 'F Minor',
  '4B': 'A♭ Major',
  '5A': 'C Minor',
  '5B': 'E♭ Major',
  '6A': 'G Minor',
  '6B': 'B♭ Major',
  '7A': 'D Minor',
  '7B': 'F Major',
  '8A': 'A Minor',
  '8B': 'C Major',
  '9A': 'E Minor',
  '9B': 'G Major',
  '10A': 'B Minor',
  '10B': 'D Major',
  '11A': 'F♯ Minor',
  '11B': 'A Major',
  '12A': 'D♭ Minor',
  '12B': 'E Major',
};

const KEY_TO_CAMELOT = Object.entries(CAMELOT_TO_KEY).reduce((acc, [camelot, key]) => {
  acc[key] = camelot;
  // Add variations
  acc[key.replace('♭', 'b').replace('♯', '#')] = camelot;
  return acc;
}, {});

/**
 * Get compatible Camelot keys for harmonic mixing
 * Compatible keys are: same key, +1, -1, and opposite letter (A<->B)
 */
export function getCompatibleCamelotKeys(camelot) {
  // Comprehensive type and format validation
  if (!camelot) return [];
  if (typeof camelot !== 'string') return [];
  
  // Trim whitespace and ensure format
  const cleaned = String(camelot).trim();
  if (!cleaned || cleaned.length === 0) return [];
  
  // Safely attempt regex match
  let match;
  try {
    match = cleaned.match(/^(\d+)([AB])$/);
  } catch (error) {
    console.warn('Camelot match error:', error);
    return [];
  }
  
  if (!match || !match[1] || !match[2]) return [];
  
  const number = parseInt(match[1]);
  const letter = match[2];
  
  const compatible = [
    cleaned, // Same key (perfect mix)
    `${number}${letter === 'A' ? 'B' : 'A'}`, // Relative major/minor (energy shift)
    `${number === 12 ? 1 : number + 1}${letter}`, // +1 semitone up
    `${number === 1 ? 12 : number - 1}${letter}`, // -1 semitone down
  ];
  
  return [...new Set(compatible)];
}

/**
 * Get compatible musical keys for harmonic mixing
 */
export function getCompatibleKeys(key) {
  if (!key || typeof key !== 'string') return [];
  
  const camelot = keyCamelot(key);
  if (!camelot || typeof camelot !== 'string') return [];
  
  const compatibleCamelots = getCompatibleCamelotKeys(camelot);
  return compatibleCamelots
    .map(c => CAMELOT_TO_KEY[c])
    .filter(Boolean);
}

/**
 * Convert musical key to Camelot notation
 */
export function keyCamelot(key) {
  if (!key || typeof key !== 'string') return null;
  return KEY_TO_CAMELOT[key] || null;
}

/**
 * Get BPM compatibility range
 * Tracks within ±6% BPM are generally mixable
 * Tracks at double/half tempo are also compatible
 */
export function isBPMCompatible(bpm1, bpm2) {
  if (!bpm1 || !bpm2 || typeof bpm1 !== 'number' || typeof bpm2 !== 'number') return false;
  
  const ratio = bpm1 / bpm2;
  
  // Within 6% range
  if (ratio >= 0.94 && ratio <= 1.06) return true;
  
  // Double tempo
  if (ratio >= 1.88 && ratio <= 2.12) return true;
  
  // Half tempo
  if (ratio >= 0.47 && ratio <= 0.53) return true;
  
  return false;
}

/**
 * Calculate compatibility score between two tracks (0-100)
 */
export function calculateCompatibilityScore(track1, track2) {
  if (!track1 || !track2) return 0;
  
  let score = 0;
  let factors = 0;
  
  // Key compatibility (40 points)
  if (track1.camelot && track2.camelot && typeof track1.camelot === 'string' && typeof track2.camelot === 'string') {
    const compatible = getCompatibleCamelotKeys(track1.camelot);
    if (track1.camelot === track2.camelot) {
      score += 40; // Perfect key match
    } else if (compatible.includes(track2.camelot)) {
      score += 30; // Compatible key
    }
    factors++;
  }
  
  // BPM compatibility (30 points)
  if (track1.bpm && track2.bpm) {
    if (isBPMCompatible(track1.bpm, track2.bpm)) {
      const difference = Math.abs(track1.bpm - track2.bpm);
      score += Math.max(30 - difference, 15);
    }
    factors++;
  }
  
  // Genre compatibility (15 points)
  if (track1.sub_genre && track2.sub_genre) {
    if (track1.sub_genre === track2.sub_genre) {
      score += 15;
    } else if (track1.genre && track2.genre && track1.genre === track2.genre) {
      score += 8;
    }
    factors++;
  }
  
  // Energy compatibility (15 points)
  if (track1.energy && track2.energy) {
    const energyDiff = Math.abs(track1.energy - track2.energy);
    score += Math.max(15 - energyDiff * 2, 0);
    factors++;
  }
  
  return factors > 0 ? Math.round(score) : 0;
}

/**
 * Find compatible tracks from a library
 */
export function findCompatibleTracks(track, allTracks, limit = 10) {
  if (!track || !allTracks || allTracks.length === 0) return [];
  
  return allTracks
    .filter(t => t.id !== track.id) // Exclude the track itself
    .map(t => ({
      ...t,
      compatibilityScore: calculateCompatibilityScore(track, t)
    }))
    .filter(t => t.compatibilityScore >= 30) // Only show reasonably compatible tracks
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, limit);
}