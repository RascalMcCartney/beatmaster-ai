import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export function useMIDI() {
  const [midiAccess, setMidiAccess] = useState(null);
  const [devices, setDevices] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const [mappings, setMappings] = useState({});
  const [learningControl, setLearningControl] = useState(null);
  const listenersRef = useRef(new Map());

  // Initialize Web MIDI API
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      setIsSupported(true);
      navigator.requestMIDIAccess()
        .then((access) => {
          setMidiAccess(access);
          updateDevices(access);

          // Listen for device changes
          access.onstatechange = () => updateDevices(access);
        })
        .catch((err) => {
          console.error('MIDI access denied:', err);
          toast.error('MIDI access denied');
        });
    }

    // Load saved mappings from localStorage
    const saved = localStorage.getItem('midiMappings');
    if (saved) {
      try {
        setMappings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load MIDI mappings:', e);
      }
    }
  }, []);

  const updateDevices = (access) => {
    const inputs = Array.from(access.inputs.values());
    setDevices(inputs);
  };

  // Save mappings to localStorage
  useEffect(() => {
    if (Object.keys(mappings).length > 0) {
      localStorage.setItem('midiMappings', JSON.stringify(mappings));
    }
  }, [mappings]);

  // Start learning mode for a control
  const startLearning = useCallback((controlId) => {
    setLearningControl(controlId);
    toast.info('Move a MIDI control to map it...');
  }, []);

  // Stop learning mode
  const stopLearning = useCallback(() => {
    setLearningControl(null);
  }, []);

  // Handle incoming MIDI messages
  const handleMIDIMessage = useCallback((event) => {
    const [status, data1, data2] = event.data;
    const messageType = status & 0xf0;
    const channel = status & 0x0f;

    // Create unique identifier for this MIDI control
    const controlKey = `${messageType}-${channel}-${data1}`;

    // If in learning mode, map this control
    if (learningControl) {
      setMappings(prev => ({
        ...prev,
        [learningControl]: {
          messageType,
          channel,
          control: data1,
          controlKey
        }
      }));
      toast.success('MIDI control mapped!');
      setLearningControl(null);
      return;
    }

    // Otherwise, trigger the mapped action
    const mappedControl = Object.entries(mappings).find(
      ([_, mapping]) => mapping.controlKey === controlKey
    );

    if (mappedControl) {
      const [controlId, mapping] = mappedControl;
      const normalizedValue = data2 / 127; // Normalize to 0-1

      // Trigger all registered listeners for this control
      const listeners = listenersRef.current.get(controlId);
      if (listeners) {
        listeners.forEach(callback => callback(normalizedValue, data2));
      }
    }
  }, [learningControl, mappings]);

  // Set up MIDI input listeners
  useEffect(() => {
    if (!midiAccess) return;

    const inputs = Array.from(midiAccess.inputs.values());
    inputs.forEach(input => {
      input.onmidimessage = handleMIDIMessage;
    });

    return () => {
      inputs.forEach(input => {
        input.onmidimessage = null;
      });
    };
  }, [midiAccess, handleMIDIMessage]);

  // Register a callback for a specific control
  const onControl = useCallback((controlId, callback) => {
    if (!listenersRef.current.has(controlId)) {
      listenersRef.current.set(controlId, new Set());
    }
    listenersRef.current.get(controlId).add(callback);

    // Return cleanup function
    return () => {
      const listeners = listenersRef.current.get(controlId);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }, []);

  // Remove a mapping
  const removeMapping = useCallback((controlId) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[controlId];
      return newMappings;
    });
    toast.success('Mapping removed');
  }, []);

  // Clear all mappings
  const clearAllMappings = useCallback(() => {
    setMappings({});
    localStorage.removeItem('midiMappings');
    toast.success('All mappings cleared');
  }, []);

  return {
    isSupported,
    devices,
    mappings,
    learningControl,
    startLearning,
    stopLearning,
    onControl,
    removeMapping,
    clearAllMappings
  };
}