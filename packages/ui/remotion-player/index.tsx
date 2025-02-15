import React, {ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CallbackListener, Player, PlayerRef, RenderLoading, Thumbnail} from '@remotion/player';
import {
  AbsoluteFill,
  Series,
  Audio as AudioRemotion,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  Easing,
  cancelRender, continueRender, delayRender, spring, random, Video,
} from 'remotion';
import {useInView} from 'react-intersection-observer';
import useWindowsResize from "../../hook/use-windows-resize";
import { preloadAudio as preloadAudioRemotion, preloadVideo } from '@remotion/preload';

import {isEqual} from "lodash";
import {GifOverlay} from "./remotion-lottie-sprite";
import {useSequentialLoader} from "./useAssetPreloader";
import {MyComposition} from "./demo";

const mediaCache = new Map<string, HTMLImageElement | HTMLVideoElement>();

const useMediaPreloader = (mediaSources: Array<{ url: string; type: string }>) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const mediaSourcesRef = useRef<Array<{ url: string; type: string }>>([]);
  const cancelPreloadRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    let isMounted = true;
    if (!isEqual(mediaSourcesRef.current, mediaSources)) {
      setMediaLoaded(false);
      mediaSourcesRef.current = [...mediaSources];

      // Cancel any ongoing preloads
      cancelPreloadRef.current.forEach(cancel => cancel());
      cancelPreloadRef.current = [];

      const loadMedia = async (source: { url: string; type: string }) => {
        if (mediaCache.has(source.url)) {
          return mediaCache.get(source.url);
        }

        return new Promise<void>((resolve, reject) => {
          if (source.type === 'VIDEO') {
            const cancelPreload = preloadVideo(source.url);
            cancelPreloadRef.current.push(cancelPreload);

            const video = document.createElement('video');
            video.src = source.url;
            video.onloadedmetadata = () => {
              mediaCache.set(source.url, video);
              resolve();
            };
            video.onerror = () => reject(source.url);
          } else {
            const img = new Image();
            img.src = source.url;
            img.onload = () => {
              mediaCache.set(source.url, img);
              resolve();
            };
            img.onerror = () => reject(source.url);
          }
        });
      };

      Promise.all(mediaSources.map(loadMedia))
        .then(() => {
          if (isMounted) {
            setMediaLoaded(true);
          }
        })
        .catch((errorSrc) => {
          if (isMounted) {
            setErrors((prevErrors) => [...prevErrors, errorSrc]);
          }
        });
    } else {
      setMediaLoaded(true);
    }

    return () => {
      isMounted = false;
      // Cancel any ongoing preloads when unmounting
      cancelPreloadRef.current.forEach(cancel => cancel());
    };
  }, [mediaSources, mediaLoaded]);

  return { mediaLoaded, errors };
};

function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash;
}

const audioCache = new Map();
const useOptimizedAudioProcessing = (fps: number) => {
  const audioContext = useRef<AudioContext | null>(null);
  const BUFFER_DURATION = 0.1; // 100ms buffer

  const memoizedProcessAudio = useMemo(() => {
    const processAudioInner = async (subtitle: string, voice: string, language: string) => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const cacheKey = `${simpleHash(subtitle)}_${voice}_${language}`;

      if (audioCache.has(cacheKey)) {
        const cachedData = audioCache.get(cacheKey);
        return {
          ttsDuration: cachedData.duration,
          ttsDurationInFrames: Math.ceil((cachedData.duration + BUFFER_DURATION) * fps),
          audioUrl: cachedData.url,
          audioBuffer: cachedData.buffer
        };
      }

      try {
        console.log({subtitle, voice, language})
        const audio: any = await getTTSAudioUrl(subtitle, voice, language);

        const audioData = {
          url: audio?.url,
          duration: audio.duration + BUFFER_DURATION
        };

        await preloadAudioRemotion(audio?.url);
        audioCache.set(cacheKey, audioData);

        return {
          ttsDuration: audioData.duration,
          ttsDurationInFrames: Math.ceil(audioData.duration * fps),
          audioUrl: audioData.url
        };
      } catch (error) {
        console.error('Error processing audio:', error);
        throw error;
      }
    };

    return processAudioInner;
  }, [fps]);

  return {
    processAudio: useCallback(memoizedProcessAudio, [memoizedProcessAudio])
  };
};


export const getTTSAudioUrl = async (text: string, voice_name = 'vi-VN-Neural2-D', language = 'Vietnamese') => {
  const res = await fetch(`https://api-v2.trainizi.com/api/ai/generate_audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      script: text,
      language_code: 'Vietnamese',
      voice: 'vi-VN-Neural2-A'
    })
  }).then(result => result.json());

  if (res) {
    return {
      url: res?.url,
      duration: res?.duration
    };
  }

  return undefined;
};

interface Frame {
  start_time?: number;
  end_time?: number;
  duration?: number;
  url: string;
  text: string;
  type: string;
  audioUrl: string;
}

export interface VideoConfigRemotion {
  avatar: boolean;
  avatarTemplate: string;
  voice: string;
  musicUrl: string;
  language?: string;
  voiceUrl?: string;
}

interface VideoData {
  videoId: string;
  musicUrl?: string;
  frames: Frame[];
  videoConfig?: VideoConfigRemotion;
}

const EnterpriseText: React.FC<{ text: string }> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const baseFontSize = Math.min(width, height) * 0.045;

  const words = text?.split?.(' ') ?? [];
  const p = interpolate(
    frame,
    [0, 15],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  )

  return (
    <div className={`p-0.5 rounded-lg flex flex-wrap justify-center`}>
      {words.map((word, i) => {
        const delay = i * 3;
        const progress = interpolate(
          frame - delay,
          [0, 15],
          [0, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }
        );

        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const translateY = interpolate(progress, [0, 1], [10, 0]);

        return (
          <span
            key={i}
            className="mr-1.5 mb-0.5"
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              display: 'inline-block',
              fontSize: `${baseFontSize}px`,
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const VideoFrame: React.FC<{ frameData: Frame; videoConfig?: VideoConfigRemotion;}> = ({frameData, videoConfig = undefined}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const scale = interpolate(progress, [0, 1], [1.1, 1]);

  const opacity = interpolate(
    progress,
    [0, 0.1, 0.7, 1],
    [0.3, 1, 1, 0.3],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const sharedStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    transform: `scale(${scale})`,
    opacity: opacity,
    margin: 'auto',
  };


  return (
    <AbsoluteFill style={{ background: '#222' }}>
      {frameData.type === 'VIDEO' ? (
        <Video
          pauseWhenBuffering
          playbackRate={1}
          preload="auto"
          muted={false}
          playsInline
          src={frameData.url}
          style={sharedStyles}
        />
      ) : (
        <Img
          src={frameData.url}
          alt={frameData.text}
          style={sharedStyles}
        />
      )}
      <SubtitleOverlay isvtc={!!videoConfig?.voiceUrl} text={frameData.text} />
    </AbsoluteFill>
  );
};

const VideoAvatarFrame: React.FC<{ videoConfig?: VideoConfigRemotion;}> = ({videoConfig = undefined}) => {
  const [size, setSize] = useState(80);
  const { width, height } = useVideoConfig();

  useEffect(() => {
    const smallerDimension = Math.min(width, height);
    setSize(Math.max(smallerDimension * 0.25, 80));
  }, [width, height]);

  return (
    <AbsoluteFill style={{ zIndex: 2 }}>
      <div style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        bottom: `${size*3}px`,
        right: `${size * 0.15}px`,
        opacity: 1,
        borderRadius: `${size}px`,
        overflow: 'hidden',
      }}>
        {videoConfig.voiceUrl && videoConfig?.voiceUrl?.includes?.('.mp4') && (
          <Video
            pauseWhenBuffering
            playbackRate={1}
            preload="auto"
            muted={false}
            playsInline
            volume={1}
            src={videoConfig.voiceUrl}
          />
        )
        }
      </div>
    </AbsoluteFill>
  );
};

const SubtitleOverlay: React.FC<{ text: string, isvtc?:boolean }> = ({text, isvtc = false}) => {
  return (
    <AbsoluteFill
      style={{
        top: 'auto',
        bottom: 'auto',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'end',
        padding: '0 30px 120px 30px',
        zIndex: 3,
      }}
    >
      <EnterpriseText text={text}/>
    </AbsoluteFill>
  );
};

const LoadingOverlay: React.FC = ({children}: {children: ReactNode}) => (
  <AbsoluteFill
    style={{
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}
  >
    <div
      style={{
        color: 'white',
        fontSize: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          border: '3px solid #fff',
          borderTop: '3px solid #3498db',
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 1s linear infinite',
        }}
      />
      {children}
    </div>
  </AbsoluteFill>
);

const VideoComposition: React.FC<{
  data: VideoData,
  isLoading?: boolean;
  isPlaying?: boolean;
  callback: (frames: any[], fps: number, totalDuration?: number) => void;
}> = ({ data, callback, isLoading, isPlaying }) => {
  const transitionDuration = 20;
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const [localLoading, setLocalLoading] = useState<boolean>(true);
  const { processAudio } = useOptimizedAudioProcessing(fps);

  // Prepare media sources
  const mediaSources = useMemo(() =>
      data.frames.map(frame => ({ url: frame.url, type: frame.type })),
    [data.frames]
  );


  // Configure voice settings
  const voiceConfig = useMemo(() => ({
    voice: data?.videoConfig?.voice ?? '',
    language: 'vi-VN-Neural2-A'
  }), [data?.videoConfig?.voice]);

  // Use the sequential loader
  const {
    isFullyLoaded,
    errors,
    processedFrames,
    loadingState,
    version,
    totalDuration: totalDurationVideo
  } = useSequentialLoader(
    mediaSources,
    processAudio,
    data.frames,
    voiceConfig,
    data?.videoConfig?.musicUrl,
    data?.videoConfig?.voiceUrl,
    fps,
  );

  // Calculate frame durations once everything is loaded
  const frameDurations = useMemo(() => {
    if (!isFullyLoaded || !processedFrames.length) return [];

    let currentFrame = 0;
    return processedFrames.map((frame) => {
      const duration = frame.ttsDurationInFrames + transitionDuration;
      const startFrame = currentFrame;
      currentFrame += duration;

      return {
        startFrame,
        endFrame: currentFrame,
        duration,
        item: frame,
        audioUrl: frame.audioUrl,
        audioDuration: frame.ttsDuration
      };
    });
  }, [isFullyLoaded, processedFrames, transitionDuration]);

  // Notify parent when everything is ready
  useEffect(() => {

    if (isFullyLoaded && frameDurations.length > 0) {
      let totalDuration = frameDurations.reduce((sum, { duration }) => sum + duration, 0);

      if(data?.videoConfig?.voiceUrl) {
        // totalDuration = totalDurationVideo
      }
      setLocalLoading(false);
      callback?.(frameDurations, fps, totalDuration);
    }
  }, [isFullyLoaded, frameDurations, fps, totalDurationVideo]);

  // Show loading state with details
  if (localLoading || !isFullyLoaded) {
    return (
      // @ts-ignore
      <LoadingOverlay>
        {/*<div className="loading-details">*/}
        {/*  {loadingState.mediaLoaded ? '✓' : '○'} Media Loading*/}
        {/*  {loadingState.audioProcessed ? '✓' : '○'} Audio Processing*/}
        {/*  {loadingState.audioPreloaded ? '✓' : '○'} Audio Preloading*/}
        {/*</div>*/}
      </LoadingOverlay>
    );
  }

  if (errors.length > 0) {
    return <ErrorDisplay message={`Failed to load assets: ${errors.join(', ')}`} />;
  }

  return (
    <AbsoluteFill>
      <Series>
        {frameDurations.map(({ duration, item, audioUrl }, idx) => (
          <Series.Sequence key={`${item.url}_${version}_${idx}`} durationInFrames={duration}>
            <VideoFrame videoConfig={data?.videoConfig} frameData={item} />
            {!data?.videoConfig?.voiceUrl && (
              <AudioRemotion
                volume={1}
                src={audioUrl}
                playsInline
                playbackRate={1}
                loop
                pauseWhenBuffering
              />
            )}
          </Series.Sequence>
        ))}
      </Series>
      {/*{(data?.videoConfig?.musicUrl && !data?.videoConfig?.voiceUrl?.includes?.('.mp3')) && (*/}
      {/*  <AudioRemotion*/}
      {/*    loop*/}
      {/*    src={data?.videoConfig?.musicUrl}*/}
      {/*    volume={1}*/}
      {/*  />*/}
      {/*)}*/}
      {data?.videoConfig.voiceUrl && data?.videoConfig?.voiceUrl?.includes?.('.mp3') && (
        <AudioRemotion
          playsInline
          playbackRate={1}
          loop
          src={data?.videoConfig?.voiceUrl}
          volume={1}
        />
      )
      }
      {data?.videoConfig?.voiceUrl && (
        <VideoAvatarFrame
          videoConfig={data?.videoConfig}
        />
      )}

      {data?.videoConfig?.voiceUrl && (
        <AbsoluteFill style={{
          display: 'flex',
          justifyContent: 'end',
          flexDirection: 'column',
          zIndex: 0
        }}>
          <img
            src="/pa.png"
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'cover'
            }}
          />
        </AbsoluteFill>
      )}
      {data?.videoConfig?.avatarTemplate && data?.videoConfig?.avatar && (
        <GifOverlay videoConfig={data?.videoConfig} isPlaying={isPlaying} />
      )}
    </AbsoluteFill>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-32 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({message}) => (
  <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-800 p-4">
    <p>{message}</p>
  </div>
);

const RemotionPlayer: React.FC<{
  data: VideoData,
  playing: boolean,
  autoPlay: boolean,
  muted: boolean,
  refVideo: any,
  onPlay: (s: boolean) => void,
  onPause: (s: boolean) => void,
  onEnded: (s: boolean) => void,
  setIsPauseLocalStore:(pasue:"Yes"|"No")=>void
}> = ({data, muted = false, playing, autoPlay = false, refVideo, onPlay, onEnded, onPause,setIsPauseLocalStore}) => {

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(1)
  const {width, height} = useWindowsResize()
  const playerRef = React.useRef<PlayerRef>(null);
  const autoPlayRef = useRef<any>(null);

  useEffect(() => {
    if(playerRef.current) {
      if(playing) {
        setIsPauseLocalStore("No")
        playerRef.current.play?.()
      } else {
        setIsPauseLocalStore("Yes")
        playerRef.current.pause?.()
      }
    }
  }, [playing, playerRef]);

  useEffect(() => {
    if (playerRef.current) {
      if (!muted) {
        playerRef.current.setVolume(1)
      } else {
        playerRef.current.setVolume(0)
      }
    }
  }, [muted, playerRef]);

  useEffect(() => {
    if (autoPlay && playerRef.current && !isLoading) {
      playerRef.current.play?.();
      setIsPlaying(true);
      onPlay?.(true);
    }
  }, [autoPlay, isLoading]);

  const handleError = useCallback((error: Error) => {
    console.error('Player error:', error);
    setError('An error occurred while playing the video. Please try again.');
  }, []);


  useEffect(() => {
    if (!playerRef.current || isLoading) {
      return;
    }


    const _onPlay: CallbackListener<'play'> = () => {
      console.log('play');
      setIsPlaying(true)
      onPlay?.(true)
    };

    const _onPause: CallbackListener<'pause'> = () => {
      console.log('pausing');
      setIsPlaying(false)
      onPause?.(false)
    };

    const _onEnded: CallbackListener<'ended'> = () => {
      console.log('ended');
      setIsPlaying(false)
      onEnded?.(false)
    };

    playerRef.current.addEventListener('play', _onPlay);
    playerRef.current.addEventListener('pause', _onPause);
    playerRef.current.addEventListener('ended', _onEnded);


    return () => {
      if (playerRef.current) {
        playerRef.current.removeEventListener('play', _onPlay);
        playerRef.current.removeEventListener('pause', _onPause);
        playerRef.current.removeEventListener('ended', _onEnded);
        autoPlayRef.current = false
        setIsPlaying(false)
      }
    };
  }, [data.videoId, playerRef.current, isLoading]);

  if (error) {
    return <ErrorDisplay message={error}/>;
  }

  const renderLoading: RenderLoading = useCallback(({height, width}) => {
    return (
      <AbsoluteFill style={{backgroundColor: 'gray'}}>

      </AbsoluteFill>
    );
  }, []);

  return (
    <div className="w-full h-full relative">
      <Player
        initiallyMuted={muted}
        ref={playerRef}
        component={VideoComposition}
        inputProps={{
          data: {
            ...data
          },
          isLoading,
          callback: (a: any, fps: any, totalDuration?: number,) => {
            console.log("DONE")
            setIsLoading(false);
            onPlay?.(true);
            setTotalDuration(totalDuration ?? 1)
          },
          isPlaying,
        }}
        durationInFrames={Math.round(totalDuration + 10) ?? 1}
        compositionWidth={parseInt(String(width)) || 720}
        compositionHeight={parseInt(String(height)) || 1080}
        fps={30}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        controls={false}
        loop={false}
        clickToPlay={false}
        spaceKeyToPlayOrPause={false}
        allowFullscreen
        renderLoading={renderLoading}
        errorFallback={({error}) => {

          return <ErrorDisplay message={error.message}/>
        }}
      />
    </div>
  );
};


export const RemotionThumbnail: React.FC<{ data: VideoData }> = ({data}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalDuration = data.frames[data.frames.length - 1].end_time;
  const {width, height} = useWindowsResize()

  const dataRef = useRef<any>(null);

  // useEffect(() => {
  //   const preloadAssets = async () => {
  //     // const imagePromises = (data.frames ?? [])?.slice(0, 1).map(frame => preloadImage(frame.url));
  //     try {
  //       await Promise.all([...imagePromises]);
  //       setIsLoading(false);
  //     } catch (error) {
  //       console.error('Error preloading assets:', error);
  //       setError('Failed to load video assets. Please check your connection and try again.');
  //       setIsLoading(false);
  //     }
  //   };
  //
  //   if(!isEqual(dataRef?.current, data)) {
  //     preloadAssets();
  //     console.log("VA OAOAO")
  //     dataRef.current = data
  //   }
  // }, [data]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-800 font-semibold">
        <LoadingSpinner/>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error}/>;
  }

  return (
    <div className="w-full h-full relative scale-125">
      <Thumbnail
        component={VideoComposition}
        inputProps={{data, callback: () => {}}}
        durationInFrames={Math.round(totalDuration * 30)}
        compositionWidth={width}
        compositionHeight={height}
        fps={30}
        style={{
          width: '100%',
          aspectRatio: '9 / 16',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        frameToDisplay={10}/>
    </div>
  );
};

const VideoRemotionComponentPlayer = ({
                                        data = {}, playing = true, autoPlay = false, muted = false, refVideo, onPlay = () => {
  }, onPause = () => {
  }, onEnded = () => {
  },setIsPauseLocalStore

                                      }: any) => {
  const {ref, inView} = useInView({
    threshold: 0
  });

  if (!data?.videoId) return <div/>

  console.log(data)
  return (
    <div className="w-full h-full" ref={ref}>
      {
        inView && (
          <RemotionPlayer autoPlay={autoPlay} muted={muted} playing={playing} refVideo={refVideo} data={data} onPlay={onPlay}
                          onPause={onPause} onEnded={onEnded} setIsPauseLocalStore={setIsPauseLocalStore}/>
        )
      }
    </div>
  );
};

export const VideoRemotionComponentThumbnail = ({videoObject = {}}: any) => {
  const data: any = JSON.parse(videoObject?.frames ?? '{}');
  if (!data?.videoId) return <div/>


  return (
    <div className="w-full h-full">
      <RemotionThumbnail data={data}/>
    </div>
  );
};

export default VideoRemotionComponentPlayer;
