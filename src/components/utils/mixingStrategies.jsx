// Advanced mixing strategies for Auto-DJ

/**
 * Calculate beat-matched transition point
 * Aligns transitions on phrase boundaries (typically 8, 16, or 32 beats)
 */
export const calculateBeatMatchedTransition = (track, transitionType, mixingStyle) => {
  if (!track?.bpm || !track?.duration) {
    return track?.duration ? track.duration - 16 : 30;
  }

  const beatInterval = 60 / track.bpm;
  const phraseLengths = {
    quick_cut: 8,      // 8 beats (2 bars)
    harmonic: 16,      // 16 beats (4 bars)
    echo_out: 32,      // 32 beats (8 bars)
  };

  const phraseBeats = phraseLengths[transitionType] || 16;
  const phraseLength = beatInterval * phraseBeats;

  // Find best transition point based on structure and phrase alignment
  if (track.structure && typeof track.structure === 'object') {
    const { outro, chorus, breakdown, drop } = track.structure;

    // Quick cut prefers drop or energetic sections
    if (transitionType === 'quick_cut') {
      if (Array.isArray(drop) && drop.length > 0) {
        const lastDrop = drop[drop.length - 1];
        if (lastDrop && typeof lastDrop.start === 'number') {
          return alignToPhraseStart(lastDrop.start, track.bpm, phraseBeats);
        }
      }
    }

    // Echo out prefers breakdown or outro
    if (transitionType === 'echo_out') {
      if (Array.isArray(breakdown) && breakdown.length > 0) {
        const lastBreakdown = breakdown[breakdown.length - 1];
        if (lastBreakdown && typeof lastBreakdown.start === 'number') {
          return alignToPhraseStart(lastBreakdown.start, track.bpm, phraseBeats);
        }
      }
      if (outro && typeof outro.start === 'number') {
        return alignToPhraseStart(outro.start, track.bpm, phraseBeats);
      }
    }

    // Harmonic transition prefers chorus or melodic sections
    if (transitionType === 'harmonic') {
      if (Array.isArray(chorus) && chorus.length > 0) {
        const lastChorus = chorus[chorus.length - 1];
        if (lastChorus && (typeof lastChorus.end === 'number' || typeof lastChorus.start === 'number')) {
          return alignToPhraseStart(lastChorus.end || lastChorus.start, track.bpm, phraseBeats);
        }
      }
    }

    // Fallback to outro or last breakdown
    if (outro && typeof outro.start === 'number') {
      return alignToPhraseStart(outro.start, track.bpm, phraseBeats);
    }
    if (Array.isArray(breakdown) && breakdown.length > 0) {
      const lastBreakdown = breakdown[breakdown.length - 1];
      if (lastBreakdown && typeof lastBreakdown.start === 'number') {
        return alignToPhraseStart(lastBreakdown.start, track.bpm, phraseBeats);
      }
    }
  }

  // Default: align to phrase boundary before the end
  const offsetSeconds = {
    quick_cut: 16,
    harmonic: 24,
    echo_out: 32,
  }[transitionType] || 20;

  const targetTime = track.duration - offsetSeconds;
  return alignToPhraseStart(targetTime, track.bpm, phraseBeats);
};

/**
 * Align a time to the nearest phrase start (downbeat)
 */
const alignToPhraseStart = (time, bpm, phraseBeats = 16) => {
  const beatInterval = 60 / bpm;
  const phraseLength = beatInterval * phraseBeats;
  
  // Round down to nearest phrase boundary
  return Math.floor(time / phraseLength) * phraseLength;
};

/**
 * Calculate optimal entry point for incoming track
 */
export const calculateEntryPoint = (track, transitionType) => {
  if (!track?.structure || typeof track.structure !== 'object') return 0;

  const { intro, verse, chorus } = track.structure;

  switch (transitionType) {
    case 'quick_cut':
      // Quick cuts work best starting at a drop or verse
      if (Array.isArray(verse) && verse.length > 0 && verse[0] && typeof verse[0].start === 'number') {
        return verse[0].start;
      }
      if (intro && typeof intro.end === 'number') return intro.end;
      return 0;

    case 'harmonic':
      // Harmonic transitions can start at intro or build
      if (intro && typeof intro.start === 'number') return intro.start;
      return 0;

    case 'echo_out':
      // Echo transitions work best with melodic intros
      if (intro && typeof intro.start === 'number') return intro.start;
      if (Array.isArray(verse) && verse.length > 0 && verse[0] && typeof verse[0].start === 'number') {
        return verse[0].start;
      }
      return 0;

    default:
      return 0;
  }
};

/**
 * Get transition parameters based on type and compatibility
 */
export const getTransitionParameters = (trackA, trackB, transitionType, compatScore) => {
  const baseParams = {
    quick_cut: {
      duration: 4,
      curve: 'linear',
      overlap: 2,
      description: 'Sharp cut on phrase boundary'
    },
    harmonic: {
      duration: 16,
      curve: 'sine',
      overlap: 12,
      description: 'Smooth harmonic blend'
    },
    echo_out: {
      duration: 20,
      curve: 'exponential',
      overlap: 16,
      description: 'Echo fade with reverb tail'
    }
  };

  const params = baseParams[transitionType] || baseParams.harmonic;

  // Adjust duration based on compatibility
  if (compatScore >= 80) {
    params.duration *= 0.7;
  } else if (compatScore < 50) {
    params.duration *= 1.3;
  }

  // Adjust for BPM difference
  if (trackA?.bpm && trackB?.bpm) {
    const bpmDiff = Math.abs(trackA.bpm - trackB.bpm);
    if (bpmDiff > 10) {
      params.duration *= 1.2;
      params.overlap = Math.max(4, params.overlap - 4);
    }
  }

  return params;
};

/**
 * Calculate crossfade curve based on transition type
 */
export const getCrossfadeCurve = (progress, curveType) => {
  switch (curveType) {
    case 'linear':
      return {
        fadeOut: 1 - progress,
        fadeIn: progress
      };

    case 'sine':
      // Smooth S-curve
      return {
        fadeOut: Math.cos((progress * Math.PI) / 2),
        fadeIn: Math.sin((progress * Math.PI) / 2)
      };

    case 'exponential':
      // Exponential fade (good for echo out)
      return {
        fadeOut: Math.pow(1 - progress, 2),
        fadeIn: Math.pow(progress, 0.5)
      };

    case 'logarithmic':
      // Logarithmic (good for quick cuts)
      return {
        fadeOut: Math.pow(1 - progress, 0.5),
        fadeIn: Math.pow(progress, 2)
      };

    default:
      return {
        fadeOut: Math.cos((progress * Math.PI) / 2),
        fadeIn: Math.sin((progress * Math.PI) / 2)
      };
  }
};

/**
 * Determine best transition type based on track analysis
 */
export const suggestTransitionType = (trackA, trackB, compatScore) => {
  // High compatibility - use harmonic transition
  if (compatScore >= 75) {
    return 'harmonic';
  }

  // Check if both tracks have strong rhythmic elements
  const aRhythmic = trackA?.rhythmic_complexity >= 7;
  const bRhythmic = trackB?.rhythmic_complexity >= 7;
  
  if (aRhythmic && bRhythmic) {
    return 'quick_cut';
  }

  // Check for melodic tracks
  const aMelodic = trackA?.melodic_complexity >= 7;
  const bMelodic = trackB?.melodic_complexity >= 7;
  
  if (aMelodic || bMelodic) {
    return 'echo_out';
  }

  // Energy-based decision
  const energyDiff = Math.abs((trackA?.energy || 5) - (trackB?.energy || 5));
  
  if (energyDiff <= 2) {
    return 'harmonic';
  } else if (energyDiff >= 4) {
    return 'quick_cut';
  }

  return 'harmonic'; // Default
};