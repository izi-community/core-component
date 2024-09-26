import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
  prefetch,
  cancelRender, continueRender, delayRender,
} from 'remotion';
import {Gif} from '@remotion/gif';
import {useInView} from 'react-intersection-observer';
import useWindowsResize from "../../hook/use-windows-resize";

import { Lottie, LottieAnimationData } from "@remotion/lottie";

const LottieCharacterRemotion = ({url}: {url: string}) => {
  const [handle] = useState(() => delayRender(""));

  const [animationData, setAnimationData] =
    useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch(url)
      .then((data) => data.json())
      .then((json) => {
        setAnimationData(json);
        continueRender(handle);
      })
      .catch((err) => {
        cancelRender(err);
      });
  }, [handle, url]);

  if (!animationData) {
    return null;
  }

  return <Lottie loop animationData={animationData} />;
};

const imageCache = new Map<string, HTMLImageElement>();

const useImagePreloader = (imageSources: string[]) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadImage = async (src: string) => {
      if (imageCache.has(src)) {
        return imageCache.get(src);
      }

      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          imageCache.set(src, img);
          resolve();
        };
        img.onerror = () => reject(src);
      });
    };

    Promise.all(imageSources.map(loadImage))
      .then(() => {
        if (isMounted) {
          setImagesLoaded(true);
        }
      })
      .catch((errorSrc) => {
        if (isMounted) {
          setErrors((prevErrors) => [...prevErrors, errorSrc]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageSources]);

  return { imagesLoaded, errors };
};

const audioCache = new Map();

const useOptimizedAudioProcessing = (fps: number) => {
  const audioContext = useRef<AudioContext | null>(null);

  const memoizedProcessAudio = useMemo(() => {
    const processAudioInner = async (audioUrl: string, duration: number) => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const cacheKey = `${audioUrl}`;

      if (audioCache.has(cacheKey)) {
        const cachedData = audioCache.get(cacheKey)!;
        return {
          ttsDuration: cachedData.duration,
          ttsDurationInFrames: Math.ceil(cachedData.duration * fps),
          audioUrl: cachedData.url,
        };
      }

      try {
        const audioData: any = {
          url: audioUrl,
          duration: duration,
        }

        audioCache.set(cacheKey, audioData);

        return {
          ttsDuration: audioData.duration,
          ttsDurationInFrames: Math.ceil(audioData.duration * fps),
          audioUrl: audioData.url,
        };
      } catch (error) {
        console.error('Error processing audio:', error);
        throw error;
      }
    };

    return processAudioInner;
  }, [fps]);

  return useCallback(memoizedProcessAudio, [memoizedProcessAudio]);
};

export const getTTSAudioUrl = async (url = '', duration = 10) => {
  return {
    url: url,
    duration: duration,
  };
}

interface Frame {
  start_time: number;
  end_time: number;
  url: string;
  text: string;
  type: string;
  audioUrl: string;
}

interface VideoData {
  videoId: string;
  musicUrl: string;
  frames: Frame[];
}

const MIN_TRANSITION_DURATION = 15; // Minimum transition duration in frames
const MAX_TRANSITION_DURATION = 15; // Maximum transition duration in frames

const calculateTransitionDuration = (frameDuration: number): number => {
  // Calculate 10% of the frame duration
  const transitionDuration = Math.round(frameDuration * 0.1);

  // Clamp the value between MIN_TRANSITION_DURATION and MAX_TRANSITION_DURATION
  return Math.min(Math.max(transitionDuration, MIN_TRANSITION_DURATION), MAX_TRANSITION_DURATION);
};

const EnterpriseText: React.FC<{ text: string }> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const words = text.split(' ');

  return (
    <div className="flex flex-wrap justify-center">
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
              fontSize: '24px',
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

const VideoFrame: React.FC<{ frameData: Frame; }> = ({frameData}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();

  const progress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const scale = interpolate(progress, [0, 1], [1.2, 1]);

  // Smooth opacity transition for both fade-in and fade-out
  const opacity = interpolate(
    progress,
    [0, 0.1, 0.9, 1],  // Four keyframes for smoother transition
    [0, 1, 1, 0.3],      // Corresponding opacity values
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <Img
        src={frameData.url}
        alt={frameData.text}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: `scale(${scale})`,
          opacity: 1,
        }}
      />
      <SubtitleOverlay text={frameData.text}/>
      <AudioRemotion playsInline src={frameData.audioUrl}/>
    </AbsoluteFill>
  );
};

const SubtitleOverlay: React.FC<{ text: string }> = ({text}) => {
  return (
    <AbsoluteFill
      style={{
        top: 'auto',
        bottom: 'auto',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 30px',
        zIndex: 3,

      }}
    >
      <EnterpriseText text={text}/>
    </AbsoluteFill>
  );
};

const LoadingOverlay: React.FC = () => (
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
      <LoadingSpinner/>
    </div>
  </AbsoluteFill>
);


const VideoComposition: React.FC<{
  data: VideoData,
  isLoading?: boolean;
  callback: (a: any, fps: any, totalDuration?: number, ) => void;
}> = ({data, callback, isLoading}) => {
  const transitionDuration = 10
  const {fps} = useVideoConfig();
  const [frameDurations, setFrameDurations] = useState<any[]>([]);
  const processAudio = useOptimizedAudioProcessing(fps);

  const imageUrls = data.frames.map(frame => frame.url);
  const { imagesLoaded, errors } = useImagePreloader(imageUrls);

  useEffect(() => {
    const calculateFrameDurations = async () => {
      const durations = await Promise.all(
        (data?.frames ?? []).flatMap(async (item, index) => {
          let duration: number;
          const {
            ttsDuration,
            ttsDurationInFrames,
            audioUrl
          } = await processAudio(item?.audioUrl, item?.end_time - item?.start_time);

          duration = ttsDurationInFrames;

          const frames: any = [];

          frames.push({duration, item, audioUrl, id: index});

          if (index < (data.frames ?? []).length - 1) {
            frames[frames.length - 1].duration += transitionDuration;
          }

          return frames;
        })
      );

      const flattenedDurations = durations.flat();
      const sortedDurations = flattenedDurations.sort((a, b) => {
        const aId = typeof a.id === 'string' ? parseInt(a.id.split('-')[0]) : a.id;
        const bId = typeof b.id === 'string' ? parseInt(b.id.split('-')[0]) : b.id;
        return aId - bId;
      });

      let currentFrame = 0;
      const frameDurationsWithStart = sortedDurations.map(({duration, item, id, audioUrl}) => {
        const startFrame = currentFrame;
        currentFrame += duration;
        return {startFrame, duration, item, id, audioUrl};
      });

      setFrameDurations(frameDurationsWithStart);

      // Calculate total duration
      const totalDuration = frameDurationsWithStart.reduce((sum, {duration}) => sum + duration, 0);

      callback?.(frameDurationsWithStart, fps, totalDuration);
    };

    calculateFrameDurations();
  }, [data.frames, fps, processAudio]);

  if (!imagesLoaded) {
    return <LoadingOverlay />;
  }

  return (
    <AbsoluteFill>
      <Series>
        {frameDurations.map(({duration, startFrame, item, audioUrl}, index) => (
          <Series.Sequence key={item.id} durationInFrames={duration}>
            <VideoFrame frameData={item}/>
          </Series.Sequence>
        ))}
      </Series>
      <GifOverlay/>
      <AudioRemotion loop src={data.musicUrl} volume={0.5}/>
    </AbsoluteFill>
  );
};

const GifOverlay: React.FC = () => {
  const [size, setSize] = useState(460);

  useEffect(() => {
    const handleResize = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      const smallerDimension = Math.min(vw, vh);
      setSize(Math.max(smallerDimension * 0.5, 200)); // 40% of smaller dimension, minimum 200px
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <AbsoluteFill style={{zIndex: 2}}> {/* Increased z-index, but below subtitle */}
      <div
        style={{
          position: 'absolute',
          width: `${size}px`,
          height: `${size}px`,
          bottom: `-${size * 0.35}px`,
          right: `-${size * 0.2}px`,
          opacity: 1,
        }}
      >
        <LottieCharacterRemotion url={`https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/teachizi/background/male_1.json`}/>
      </div>
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
  onEnded: (s: boolean) => void
}> = ({data, muted = false, playing, autoPlay = false, refVideo, onPlay, onEnded, onPause}) => {

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalDuration = data.frames[data.frames.length - 1].end_time;
  const {width, height} = useWindowsResize()
  const playerRef = React.useRef<PlayerRef>(null);
  const autoPlayRef = useRef<any>(null);

  useEffect(() => {
    if(playerRef.current) {
      if(playing) {
        playerRef.current.play?.()
      } else if(playerRef.current.isPlaying?.()) {
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
        ...
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
          data,
          isLoading,
          callback: () => {
            console.log("DONE")
            setIsLoading(false);
            onPlay?.(true);
          }
        }}
        numberOfSharedAudioTags={data.frames.length}
        durationInFrames={Math.round(totalDuration * 30) ?? 1}
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
        <p className="ml-4">Loading training module...</p>
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
  }
                                      }: any) => {
  const {ref, inView} = useInView({
    threshold: 0
  });

  if (!data?.videoId) return <div/>

  return (
    <div className="w-full h-full" ref={ref}>
      {
        inView && (
          <RemotionPlayer autoPlay={autoPlay} muted={muted} playing={playing} refVideo={refVideo} data={data} onPlay={onPlay}
                          onPause={onPause} onEnded={onEnded}/>
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
