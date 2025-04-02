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
  audioProcessor: (text: string, voice: string, language: string, duration: number, audioUrl: string) => Promise<any>,
  frames: any[],
  voiceConfig: { voice: string; language: string },
  musicUrl?: string
) => {
  console.log(`useSequentialLoader called with ${frames.length} frames`);

  // Memoize input data to prevent unnecessary re-renders
  const memoizedSources = useMemo(() => mediaSources, [mediaSources]);
  const memoizedConfig = useMemo(() => voiceConfig, [voiceConfig]);

  // State to track loading process
  const [state, setState] = useState<LoadingState>({
    version: 0,
    mediaLoaded: false,
    audioProcessed: false,
    audioPreloaded: false,
    errors: []
  });

  // Store the frames as raw data to help detect changes
  const [currentFramesData, setCurrentFramesData] = useState<string>("");

  // Force version increment on component mount
  const [componentMounted, setComponentMounted] = useState(false);
  useEffect(() => {
    setComponentMounted(true);
  }, []);

  // Refs for tracking state and preventing duplicate processing
  const processingRef = useRef(false);
  const versionRef = useRef<number>(0);
  const cancelPreloadRef = useRef<Array<() => void>>([]);
  const audioUrlsRef = useRef<string[]>([]);
  const processedFramesRef = useRef<any[]>([]);
  const prevSourcesRef = useRef<any>(null);

  // CRITICAL FIX: Check for DEEP changes in frames array on EVERY render
  useEffect(() => {
    // Stringify the frames to compare content
    const newFramesData = JSON.stringify(frames.map(frame => ({
      url: frame.url,
      text: frame.text,
      type: frame.type,
      duration: frame.duration
    })));

    // If the content has changed, update our state
    if (newFramesData !== currentFramesData) {
      console.log("Frame content changed! Updating processed frames...");
      setCurrentFramesData(newFramesData);
    }
  });

  // Step 1: Load media (images/videos)
  const loadMedia = useCallback(async (version: number) => {
    if (!isEqual(prevSourcesRef.current, memoizedSources)) {
      prevSourcesRef.current = [...memoizedSources];

      // Clear media cache for changed URLs to force reload
      mediaSources.forEach(source => {
        mediaCache.delete(source.url);
      });

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
  }, [memoizedSources, mediaSources]);

  // Step 2: Process audio files
  const processAudio = useCallback(async (version: number) => {
    // Don't return early if we've reset the processing flag
    // We need to make sure this runs even if another process was previously running
    processingRef.current = true;

    try {
      // ALWAYS use the current frames, not stale ones
      const currentFrames = frames;

      // Clear any existing processed frames
      const processedFrames = [];
      console.log(`Processing ${currentFrames.length} frames for version ${version}`);

      // Process frames sequentially instead of parallel
      // @ts-ignore
      for (const [index, frame] of (currentFrames?.entries?.() ?? [])) {
        // Check version before processing each frame
        if (version !== versionRef.current) {
          console.log(`Version changed during processing. Aborting.`);
          break;
        }

        console.log(`Processing frame ${index}:`, {
          text: frame.text,
          url: frame.url,
          version
        });

        try {
          // Always process the frame regardless of whether audioUrl exists
          const result = await audioProcessor(
            frame.text,
            memoizedConfig.voice,
            memoizedConfig.language,
            frame.duration || 5, // Default duration if not provided
            frame.audioUrl ?? '',
          );

          // If version has changed during processing, don't add this frame
          if (version !== versionRef.current) continue;

          // Create a processed frame with ALL properties from the current frame
          const processedFrame = {
            ...frame,  // Include ALL properties from the original frame
            audioUrl: result.audioUrl,
            ttsDuration: result.ttsDuration,
            ttsDurationInFrames: result.ttsDurationInFrames,
            idx: index,
            id: index,
          };

          // Force the URL and text to match the current frame exactly
          processedFrame.url = frame.url;
          processedFrame.text = frame.text;

          processedFrames.push(processedFrame);

          console.log(`Processed frame ${index} complete:`, {
            text: processedFrames[processedFrames.length-1].text,
            url: processedFrames[processedFrames.length-1].url
          });
        } catch (error) {
          console.error(`Error processing frame: ${frame.text}`, error);
          continue;
        }
      }

      // Only update state if version hasn't changed
      if (version === versionRef.current) {
        console.log(`Setting ${processedFrames.length} processed frames`);
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
  }, [frames, memoizedConfig, audioProcessor, musicUrl]);

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

  // Main effect to coordinate sequential loading - react to currentFramesData
  useEffect(() => {
    // If this is the first render, skip immediate processing
    if (!componentMounted) return;

    // Cancel any ongoing processing
    if (processingRef.current) {
      processingRef.current = false;
    }

    // CRITICAL FIX: Reset the state immediately when frames change
    // This ensures isFullyLoaded becomes false while new frames are being processed
    setState({
      version: 0,
      mediaLoaded: false,
      audioProcessed: false,
      audioPreloaded: false,
      errors: []
    });

    // Clear processed frames to avoid using stale data
    processedFramesRef.current = [];

    // Increment version to cancel any ongoing operations
    const version = ++versionRef.current;

    // Delay starting new processing to ensure reset takes effect
    setTimeout(() => {
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
    }, 0);

    return () => {
      // Cleanup function
      cancelPreloadRef.current.forEach(cancel => cancel());
      processingRef.current = false;
    };
  }, [
    currentFramesData, // This is the key dependency - it changes when frames content changes
    componentMounted,
    processAudio,
    loadMedia,
    preloadAudioFiles
  ]);

  // Add debug logging for processedFrames changes
  useEffect(() => {
    console.log(`Current processedFrames count: ${processedFramesRef.current.length}`);
    if (processedFramesRef.current.length > 0) {
      console.log(`First frame text: ${processedFramesRef.current[0].text}`);
      console.log(`First frame URL: ${processedFramesRef.current[0].url}`);
    }
  }, [state.audioProcessed]);

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