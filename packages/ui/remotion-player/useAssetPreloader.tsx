import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { preloadAudio } from '@remotion/preload';

// Global media cache
const mediaCache = new Map<string, HTMLImageElement | HTMLVideoElement>();

interface LoadingState {
  version: number;
  mediaLoaded: boolean;
  audioProcessed: boolean;
  audioPreloaded: boolean;
  errors: string[];
  totalDuration?: number;
}

// Helper function to get audio duration
const getAudioDuration = async (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = url;

    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });

    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio file'));
    });
  });
};

/**
 * Estimates audio duration based on character count
 * Using the baseline of 84 characters ≈ 5 seconds
 *
 * @param text The input text to estimate duration for
 * @param wordsPerMinute Optional WPM rate (default calculated from baseline)
 * @returns Estimated duration in seconds
 */
export const estimateAudioDuration = (text: string, wordsPerMinute?: number) => {
  // Remove extra whitespace and normalize text
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  const charCount = normalizedText.length;

  // Using baseline: 84 chars ≈ 5 seconds
  // So 1 char ≈ 0.0595 seconds
  const CHARS_PER_SECOND = 84 / 3.5; // ≈ 16.8 chars per second

  if (wordsPerMinute) {
    // If WPM is provided, use that for calculation
    const averageWordLength = 3.5; // Average English word length
    const charsPerMinute = wordsPerMinute * averageWordLength;
    const charsPerSecond = charsPerMinute / 60;
    return charCount / charsPerSecond;
  }

  // Calculate duration using baseline ratio
  const estimatedDuration = charCount / CHARS_PER_SECOND;

  // Add a small buffer for very short texts (minimum 1 second)
  return Math.max(1, estimatedDuration);
};

/**
 * Estimates audio duration with frame timings
 * Returns both duration and frame count
 */
export const estimateAudioDurationWithFrames = (text: string, fps: number = 30) => {
  const duration = estimateAudioDuration(text);
  const frames = Math.ceil(duration * fps);

  return {
    duration,
    frames,
    durationInFrames: frames
  };
};

export const useSequentialLoader = (
  mediaSources: Array<{ url: string; type: string }>,
  audioProcessor: (text: string, voice: string, language: string) => Promise<any>,
  frames: any[],
  voiceConfig: { voice: string; language: string },
  musicUrl?: string,
  voiceUrl?: string,
  fps?: number,
) => {
  // Memoize input data to prevent unnecessary re-renders
  const memoizedSources = useMemo(() => mediaSources, [mediaSources]);
  const memoizedFrames = useMemo(() => frames, [frames]);
  const memoizedConfig = useMemo(() => voiceConfig, [voiceConfig.voice, voiceConfig.language]);

  const [state, setState] = useState<LoadingState>({
    version: 0,
    mediaLoaded: false,
    audioProcessed: false,
    audioPreloaded: false,
    errors: [],
    totalDuration: 0
  });

  // Refs for tracking state and preventing duplicate processing
  const processingRef = useRef(false);
  const prevDataRef = useRef({
    sources: null as any,
    frames: null as any,
    config: null as any,
    music: null as any,
    voice: null as any
  });
  const versionRef = useRef<number>(0);
  const cancelPreloadRef = useRef<Array<() => void>>([]);
  const audioUrlsRef = useRef<string[]>([]);
  const processedFramesRef = useRef<any[]>([]);
  const prevSourcesRef = useRef<any>(null);

  // Check if data actually changed
  const hasDataChanged = useCallback(() => {
    const currentData = {
      sources: memoizedSources,
      frames: memoizedFrames,
      config: memoizedConfig,
      music: musicUrl,
      voice: voiceUrl
    };

    if (isEqual(prevDataRef.current, currentData)) {
      return false;
    }

    prevDataRef.current = currentData;
    return true;
  }, [memoizedSources, memoizedFrames, memoizedConfig, musicUrl, voiceUrl]);

  // Step 1: Load media (images/videos)
  const loadMedia = useCallback(async (version: number) => {
    if (!isEqual(prevSourcesRef.current, memoizedSources)) {
      prevSourcesRef.current = [...memoizedSources];

      // Cancel any ongoing preloads
      cancelPreloadRef.current.forEach(cancel => cancel());
      cancelPreloadRef.current = [];

      try {
        await Promise.all(memoizedSources.map(async (source) => {
          if (mediaCache.has(source.url)) {
            return mediaCache.get(source.url);
          }

          return new Promise<void>((resolve, reject) => {
            if (source.type === 'VIDEO') {
              const video = document.createElement('video');
              video.src = source.url;
              video.onloadedmetadata = () => {
                if (version === versionRef.current) {
                  mediaCache.set(source.url, video);
                  resolve();
                }
              };
              video.onerror = () => reject(source.url);
            } else {
              const img = new Image();
              img.src = source.url;
              img.onload = () => {
                if (version === versionRef.current) {
                  mediaCache.set(source.url, img);
                  resolve();
                }
              };
              img.onerror = () => reject(source.url);
            }
          });
        }));

        if (version === versionRef.current) {
          setState(prev => ({
            ...prev,
            mediaLoaded: true
          }));
        }
      } catch (error) {
        if (version === versionRef.current) {
          setState(prev => ({
            ...prev,
            errors: [...prev.errors, error as string]
          }));
        }
      }
    } else {
      setState(prev => ({
        ...prev,
        mediaLoaded: true
      }));
    }
  }, [memoizedSources]);

  // Step 2: Process audio files
  // Step 2: Process audio files or handle voiceUrl
  const processAudio = useCallback(async (version: number) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      let totalDuration = 0;

      // Process frames sequentially if no voiceUrl
      const processedFrames = [];
      for (const frame of memoizedFrames) {

        if (version !== versionRef.current) break;

        try {
          let result: any = {
            audioUrl: '',
            ttsDuration: 0,
            ttsDurationInFrames: 0,
          };

          if(!voiceUrl) {
            result = await audioProcessor(
              frame.text,
              memoizedConfig.voice,
              memoizedConfig.language
            )
          } else {
            const a = estimateAudioDurationWithFrames(frame.text, fps)
            result = {
              audioUrl: '',
              ttsDuration: a.duration,
              ttsDurationInFrames: a.durationInFrames,
            }
          }

          totalDuration += result.ttsDuration;
          processedFrames.push({
            ...frame,
            audioUrl: result.audioUrl,
            ttsDuration: result.ttsDuration,
            ttsDurationInFrames: result.ttsDurationInFrames
          });
        } catch (error) {
          console.error(`Error processing frame: ${frame.text}`, error);
          continue;
        }
      }
      processedFramesRef.current = processedFrames;

      // Add music duration if exists
      if (voiceUrl && version === versionRef.current) {
        try {
          const musicDuration = await getAudioDuration(voiceUrl);
          totalDuration = Math.max(totalDuration, musicDuration);
        } catch (error) {
          console.warn('Failed to get music duration', error);
        }
      }

      // Only update state if version hasn't changed
      if (version === versionRef.current) {
        audioUrlsRef.current = [
          ...processedFramesRef.current.map(f => f?.audioUrl).filter(Boolean),
          musicUrl,
          voiceUrl,
        ].filter(Boolean);

        setState(prev => ({
          ...prev,
          audioProcessed: true,
          totalDuration
        }));
      }
    } catch (error) {
      if (version === versionRef.current) {
        setState(prev => ({
          ...prev,
          errors: [...prev.errors, 'Audio processing failed']
        }));
      }
    } finally {
      processingRef.current = false;
    }
  }, [memoizedFrames, audioProcessor, memoizedConfig, musicUrl, voiceUrl]);

  const isIOS = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  const isSafari = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes('safari') && !userAgent.includes('chrome');
  };

  // Step 3: Preload audio files
  const preloadAudioFiles = useCallback(async (version: number) => {
    try {
      await Promise.all(
        audioUrlsRef.current.map(async (url) => {
          if (version !== versionRef.current) return;

          // try {
          //   if(!(isIOS() || isSafari())) {
          //     await preloadAudio(url);
          //   }
          // } catch {
          //
          // }
        })
      );

      if (version === versionRef.current) {
        setState(prev => ({
          ...prev,
          audioPreloaded: true
        }));
      }
    } catch (error) {
      if (version === versionRef.current) {
        setState(prev => ({
          ...prev,
          errors: [...prev.errors, 'Audio preloading failed']
        }));
      }
    }
  }, []);

  // Main effect to coordinate sequential loading
  useEffect(() => {
    if (!hasDataChanged() || processingRef.current) {
      return;
    }

    const version = ++versionRef.current;
    setState(prev => ({
      ...prev,
      version,
      mediaLoaded: false,
      audioProcessed: false,
      audioPreloaded: false,
      errors: []
    }));

    const loadSequentially = async () => {
      // Step 1: Process audio first (potentially slowest operation)
      await processAudio(version);
      if (version !== versionRef.current) return;

      // Step 2: Load media
      await loadMedia(version);
      if (version !== versionRef.current) return;

      // Step 3: Preload audio
      await preloadAudioFiles(version);
    };

    loadSequentially();

    return () => {
      // Cleanup function
      cancelPreloadRef.current.forEach(cancel => cancel());
      processingRef.current = false;
    };
  }, [
    memoizedSources,
    memoizedFrames,
    memoizedConfig,
    musicUrl,
    hasDataChanged,
    processAudio,
    loadMedia,
    preloadAudioFiles
  ]);

  return {
    isFullyLoaded: state.mediaLoaded && state.audioProcessed && state.audioPreloaded,
    errors: state.errors,
    version: state.version,
    processedFrames: processedFramesRef.current,
    totalDuration: state.totalDuration,
    loadingState: {
      mediaLoaded: state.mediaLoaded,
      audioProcessed: state.audioProcessed,
      audioPreloaded: state.audioPreloaded
    }
  };
};