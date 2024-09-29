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
  cancelRender, continueRender, delayRender,
} from 'remotion';
import {useInView} from 'react-intersection-observer';
import useWindowsResize from "../../hook/use-windows-resize";

import { Lottie, LottieAnimationData } from "@remotion/lottie";
import {isEqual} from "lodash";

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

/* useImageCache*/

const imageCache = new Map<string, HTMLImageElement>();

const useImagePreloader = (imageSources: string[]) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const imageSourcesRef = useRef<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    if(!isEqual(imageSourcesRef.current, imageSources)) {
      setImagesLoaded(false);
      imageSourcesRef.current = [...imageSources]
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
    } else {
      setImagesLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, [imageSources, imagesLoaded]);

  return { imagesLoaded, errors };
};

/*useAudioCache*/

const audioCache = new Map();
const useOptimizedAudioProcessing = (fps: number) => {
  const audioContext = useRef<AudioContext | null>(null);
  const BUFFER_DURATION = 0.1; // 100ms buffer

  const memoizedProcessAudio = useMemo(() => {
    const processAudioInner = async (audioUrl: string, duration: number) => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const cacheKey = audioUrl;

      if (audioCache.has(cacheKey)) {
        const cachedData = audioCache.get(cacheKey);
        return {
          ttsDuration: cachedData.duration,
          ttsDurationInFrames: Math.ceil((cachedData.duration + BUFFER_DURATION) * fps),
          audioUrl: cachedData.url,
          audioBuffer: cachedData.buffer,
        };
      }

      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);

        const audioData = {
          url: audioUrl,
          duration: Math.max(duration, audioBuffer.duration) + BUFFER_DURATION,
          buffer: audioBuffer,
        };

        audioCache.set(cacheKey, audioData);

        return {
          ttsDuration: audioData.duration,
          ttsDurationInFrames: Math.ceil(audioData.duration * fps),
          audioUrl: audioData.url,
          audioBuffer: audioData.buffer,
        };
      } catch (error) {
        console.error('Error processing audio:', error);
        throw error;
      }
    };

    return processAudioInner;
  }, [fps]);

  const preloadAudio = useCallback(async (audioUrls: string[]) => {
    const preloadPromises = audioUrls.map(url => memoizedProcessAudio(url, 0));
    await Promise.all(preloadPromises);
  }, [memoizedProcessAudio]);

  return {
    processAudio: useCallback(memoizedProcessAudio, [memoizedProcessAudio]),
    preloadAudio,
  };
};


export const getTTSAudioUrl = async (url = '', duration = 10) => {
  return {
    url: url,
    duration: duration,
  };
}


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
}

interface VideoData {
  videoId: string;
  musicUrl?: string;
  frames: Frame[];
  videoConfig?: VideoConfigRemotion;
}

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

  const scale = interpolate(progress, [0, 1], [1.4, 1]);

  const opacity = interpolate(
    progress,
    [0, 0.1, 0.7, 1],
    [0.3, 1, 1, 0.3],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Img
        src={frameData.url}
        alt={frameData.text}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: `scale(${scale})`,
          opacity: opacity,
        }}
      />
      <SubtitleOverlay text={frameData.text} />
      {
        videoConfig?.avatarTemplate && (
          <GifOverlay videoConfig={videoConfig} />
        )
      }
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
  const transitionDuration = 20;
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const [frameDurations, setFrameDurations] = useState<any[]>([]);
  const {processAudio} = useOptimizedAudioProcessing(fps);
  const prevDataRef = useRef<VideoData['frames']>();

  const imageUrls = data.frames.map(frame => frame.url);
  const { imagesLoaded, errors } = useImagePreloader(imageUrls);

  const memoizedProcessAudio = useCallback(processAudio, [fps]);

  useEffect(() => {
    const calculateFrameDurations = async () => {
      if (isEqual(data.frames, prevDataRef.current)) {
        return; // Data hasn't changed, no need to recalculate
      }

      const durations = await Promise.all(
        (data?.frames ?? []).map(async (item, index) => {
          const {
            ttsDurationInFrames,
            audioUrl,
            ttsDuration
          } = await memoizedProcessAudio(item?.audioUrl, item?.duration ?? ((item?.end_time ?? 0) - (item?.start_time ?? 0)));

          const duration = ttsDurationInFrames + transitionDuration;

          return {duration, item, audioUrl, id: index, audioDuration: ttsDuration};
        })
      );

      let currentFrame = 0;
      const calculatedFrameDurations = durations.map(({duration, item, id, audioUrl, audioDuration}) => {
        const startFrame = currentFrame;
        currentFrame += duration;
        return {startFrame, endFrame: currentFrame, duration, item, id, audioUrl, audioDuration};
      });

      setFrameDurations(calculatedFrameDurations);

      const totalDuration = calculatedFrameDurations.reduce((sum, {duration}) => sum + duration, 0);
      callback?.(calculatedFrameDurations, fps, totalDuration);

      prevDataRef.current = data.frames;
    };

    calculateFrameDurations();
  }, [data.frames, memoizedProcessAudio, transitionDuration, fps, callback]);

  if (!imagesLoaded || frameDurations.length === 0) {
    return <LoadingOverlay />;
  }

  return (
    <AbsoluteFill>
      <Series>
        {frameDurations.map(({duration, item, audioUrl, startFrame, audioDuration}) => (
          <Series.Sequence key={item.id} durationInFrames={duration}>
            <VideoFrame videoConfig={data?.videoConfig} frameData={item}/>
            <AudioRemotion
              volume={1}
              src={audioUrl}
              startFrom={0}
              playsInline
            />
          </Series.Sequence>
        ))}
      </Series>
      <AudioRemotion
        loop
        src={data?.videoConfig?.musicUrl}
        volume={(f) =>
          interpolate(f, [0, 1], [0.05, 0.05], { extrapolateLeft: "clamp" , extrapolateRight: "clamp"})
        }
      />
    </AbsoluteFill>
  );
};

const GifOverlay = ({videoConfig}: {videoConfig?: VideoConfigRemotion}) => {
  const [size, setSize] = useState(460);
  const {durationInFrames, fps} = useVideoConfig();
  useEffect(() => {
    const handleResize = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      const smallerDimension = Math.min(vw, vh);
      setSize(Math.max(smallerDimension * 0.7, 400)); // 40% of smaller dimension, minimum 200px
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
          bottom: `-${size * 0.4}px`, // Adjust bottom position based on size
          right: `-${size * 0.3}px`,
          opacity: 1,
        }}
      >
        {/*<Gif*/}
        {/*  width={size}*/}
        {/*  height={size}*/}
        {/*  src="https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/teachizi/background/businessman.gif"*/}
        {/*  style={{*/}
        {/*    width: '100%',*/}
        {/*    height: '100%',*/}
        {/*    objectFit: 'contain'*/}
        {/*  }}*/}
        {/*/>*/}
        <LottieCharacterRemotion url={`https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/teachizi/background/${videoConfig?.avatarTemplate ?? 'male_1.json'}`}/>
        {/*<Video muted loop startFrom={0} endAt={durationInFrames-10} src={'https://webcdn.synthesia.io/v4-lp/V4-avatars/V4%20-%20Ada.mp4'}/>*/}
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
  const [totalDuration, setTotalDuration] = useState(1)
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
            ...data,
            videoConfig: {
              avatar: true,
              avatarTemplate: 'male_1.json',
              voice: 'vi-VN-Neural2-D',
              musicUrl: data?.musicUrl,
              ...(data?.videoConfig ?? {}),
            } as any
          },
          isLoading,
          callback: (a: any, fps: any, totalDuration?: number,) => {
            console.log("DONE")
            setIsLoading(false);
            onPlay?.(true);
            setTotalDuration(totalDuration ?? 1)
          }
        }}
        durationInFrames={Math.round(totalDuration+5) ?? 1}
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
