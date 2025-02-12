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
}

export const useSequentialLoader = (
  mediaSources: Array<{ url: string; type: string }>,
  audioProcessor: (text: string, voice: string, language: string) => Promise<any>,
  frames: any[],
  voiceConfig: { voice: string; language: string },
  musicUrl?: string
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
    errors: []
  });

  // Refs for tracking state and preventing duplicate processing
  const processingRef = useRef(false);
  const prevDataRef = useRef({
    sources: null as any,
    frames: null as any,
    config: null as any,
    music: null as any
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
      music: musicUrl
    };

    if (isEqual(prevDataRef.current, currentData)) {
      return false;
    }

    prevDataRef.current = currentData;
    return true;
  }, [memoizedSources, memoizedFrames, memoizedConfig, musicUrl]);

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
  const processAudio = useCallback(async (version: number) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const processedFrames = [];

      // Process frames sequentially instead of parallel
      for (const frame of memoizedFrames) {
        // Check version before processing each frame
        if (version !== versionRef.current) {
          break;
        }

        try {
          const result = await audioProcessor(
            frame.text,
            memoizedConfig.voice,
            memoizedConfig.language
          );

          processedFrames.push({
            ...frame,
            audioUrl: result.audioUrl,
            ttsDuration: result.ttsDuration,
            ttsDurationInFrames: result.ttsDurationInFrames
          });

          // Add small delay between requests if needed
          // await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error processing frame: ${frame.text}`, error);
          continue;
        }
      }

      // Only update state if version hasn't changed
      if (version === versionRef.current) {
        processedFramesRef.current = processedFrames;
        audioUrlsRef.current = [
          ...processedFrames.map(f => f?.audioUrl).filter(Boolean),
          musicUrl
        ].filter(Boolean);

        setState(prev => ({
          ...prev,
          audioProcessed: true
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
  }, [memoizedFrames, audioProcessor, memoizedConfig, musicUrl]);

  // Step 3: Preload audio files
  const preloadAudioFiles = useCallback(async (version: number) => {
    try {
      await Promise.all(
        audioUrlsRef.current.map(async (url) => {
          if (version !== versionRef.current) return;
          await preloadAudio(url);
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
    loadingState: {
      mediaLoaded: state.mediaLoaded,
      audioProcessed: state.audioProcessed,
      audioPreloaded: state.audioPreloaded
    }
  };
};