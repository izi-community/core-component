import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CallbackListener, Player, PlayerRef, Thumbnail } from '@remotion/player';
import {
  AbsoluteFill,
  Series,
  Audio as AudioRemotion,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  Easing
} from 'remotion';
import { Gif } from '@remotion/gif';
import { useInView } from 'react-intersection-observer';
import isEqual from 'lodash/isEqual';
import useWindowsResize from "../../hook/use-windows-resize";

const preloadImage = (src: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
};

const preloadAudio = (src: string) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.oncanplaythrough = () => resolve(src);
    audio.onerror = reject;
    audio.load();
  });
};

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

const EnterpriseText: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

const VideoFrame: React.FC<{ frameData: Frame; }> = ({ frameData}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

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
    <AbsoluteFill style={{ background: '#fff' }}>
      <Img
        src={frameData.url}
        alt={frameData.text}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: `scale(${scale})`,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};

const SubtitleOverlay: React.FC<{ text: string }> = ({ text }) => {
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
      <EnterpriseText text={text} />
    </AbsoluteFill>
  );
};

const VideoComposition: React.FC<{ data: VideoData }> = ({ data }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Series>
        {data.frames.map((frameData, index) => {
          const frameDuration = Math.round((frameData.end_time - frameData.start_time) * fps);

          return (
            <Series.Sequence durationInFrames={frameDuration} key={index}>
              <VideoFrame frameData={frameData} />
              <SubtitleOverlay text={frameData.text} />
              <AudioRemotion
                             endAt={frameDuration} src={frameData.audioUrl} />
            </Series.Sequence>
          );
        })}
      </Series>
      <GifOverlay />
      <AudioRemotion src={data.musicUrl} volume={0.5} />
    </AbsoluteFill>
  );
};

const GifOverlay: React.FC = () => {
  return (
    <AbsoluteFill style={{ zIndex: 2 }}> {/* Increased z-index, but below subtitle */}
      <div
        style={{
          position: 'absolute',
          width: '460px',
          height: '460px',
          bottom: -80,
          right: 0,
          opacity: 1,
        }}
      >
        <Gif
          width={460}
          height={460}
          src="https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/teachizi/background/bot.gif"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>
    </AbsoluteFill>
  );
};


const LoadingSpinner: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-32 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-800 p-4">
    <p>{message}</p>
  </div>
);

const RemotionPlayer: React.FC<{ data: VideoData, playing: boolean, muted: boolean, refVideo: any, onPlay: () => void, onPause: () => void, onEnded: () => void }> = ({ data, muted = false, playing, refVideo, onPlay, onEnded, onPause }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalDuration = data.frames[data.frames.length - 1].end_time;
  const {width, height} = useWindowsResize()

  const playerRef = React.useRef<PlayerRef>(null);
  const dataRef = useRef<any>(null);

  const [preloadedAssets, setPreloadedAssets] = useState<string[]>([]);

  useEffect(() => {
    const preloadAssets = async () => {
      const allAssets = (data.frames ?? []).flatMap(frame => [frame.url, frame.audioUrl]);
      // @ts-ignore
      const uniqueAssets = [...new Set(allAssets)].filter(Boolean); // Filter out any null or undefined values
      const assetsToLoad = uniqueAssets.filter(asset => !preloadedAssets.includes(asset));

      if (assetsToLoad.length === 0) {
        setIsLoading(false);
        return;
      }

      const imagePromises = assetsToLoad.filter(asset => asset.match(/\.(jpeg|jpg|gif|png)$/i)).map(preloadImage);
      const audioPromises = assetsToLoad.filter(asset => asset.match(/\.(mp3|wav|ogg)$/i)).map(preloadAudio);

      try {
        const loadedAssets = await Promise.all([...imagePromises, ...audioPromises]);
        setPreloadedAssets((prev: any) => [...prev, ...loadedAssets]);
        setIsLoading(false);
        onPlay?.()
      } catch (error) {
        console.error('Error preloading assets:', error);
        setError('Failed to load video assets. Please check your connection and try again.');
        setIsLoading(false);
      }
    };

    if (!isEqual(dataRef.current, data.videoId)) {
      setIsLoading(true);
      preloadAssets();
      dataRef.current = data.videoId;
    }
  }, [data.frames, data.videoId, preloadedAssets]);

  useEffect(() => {
    if(playerRef.current) {
      if(playing) {
        playerRef.current.play?.()
      } else {
        playerRef.current.pause?.()
      }
    }
  }, [playing, playerRef]);

  useEffect(() => {
    if(playerRef.current) {
      if(!muted) {
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

    console.log("VAO DAY", playerRef.current);

    const _onPlay: CallbackListener<'play'> = () => {
      console.log('play');
      setIsPlaying(true)
      onPlay?.()
    };

    const _onPause: CallbackListener<'pause'> = () => {
      console.log('pausing');
      setIsPlaying(false)
      onPause?.()
    };

    const _onEnded: CallbackListener<'ended'> = () => {
      console.log('ended');
      setIsPlaying(false)
      onEnded?.()
    };

    playerRef.current.addEventListener('play', _onPlay);
    playerRef.current.addEventListener('pause', _onPause);
    playerRef.current.addEventListener('ended', _onEnded);


    return () => {
      if (playerRef.current) {
        playerRef.current.removeEventListener('play', _onPlay);
        playerRef.current.removeEventListener('pause', _onPause);
        playerRef.current.removeEventListener('ended', _onEnded);
        setIsPlaying(false)
      }
    };
  }, [data.videoId, playerRef.current, isLoading]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-800 font-semibold">

      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="w-full h-full relative">
      <Player
        initiallyMuted={muted}
        ref={playerRef}
        component={VideoComposition}
        inputProps={{ data }}
        durationInFrames={Math.round(totalDuration * 30)}
        compositionWidth={parseInt(String(width))}
        compositionHeight={parseInt(String(height))}
        fps={30}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        controls={false}
        autoPlay={true}
        loop={false}
        clickToPlay={false}
        spaceKeyToPlayOrPause={false}
        allowFullscreen
        errorFallback={({ error }) => <ErrorDisplay message={error.message} />}
      />
    </div>
  );
};


export const RemotionThumbnail: React.FC<{ data: VideoData }> = ({ data }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalDuration = data.frames[data.frames.length - 1].end_time;
  const {width, height} = useWindowsResize()

  const dataRef = useRef<any>(null);

  useEffect(() => {
    const preloadAssets = async () => {
      const imagePromises = (data.frames ?? [])?.slice(0, 1).map(frame => preloadImage(frame.url));
      try {
        await Promise.all([...imagePromises]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error preloading assets:', error);
        setError('Failed to load video assets. Please check your connection and try again.');
        setIsLoading(false);
      }
    };

    if(!isEqual(dataRef?.current, data)) {
      preloadAssets();
      console.log("VA OAOAO")
      dataRef.current = data
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-800 font-semibold">
        <LoadingSpinner />
        <p className="ml-4">Loading training module...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="w-full h-full relative scale-125">
      <Thumbnail
        component={VideoComposition}
        inputProps={{ data }}
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

const VideoRemotionComponentPlayer = ({data = {}, playing = true, muted = false, refVideo, onPlay = () => {}, onPause=  () => {}, onEnded = () => {}}: any) => {
  const { ref, inView } = useInView({
    threshold: 0
  });

  if(!data?.videoId) return <div/>


  return (
    <div className="w-full h-full" ref={ref}>
      {
        inView && (
          <RemotionPlayer muted={muted} playing={playing} refVideo={refVideo} data={data} onPlay={onPlay} onPause={onPause} onEnded={onEnded}/>
        )
      }
    </div>
  );
};

export const VideoRemotionComponentThumbnail = ({videoObject = {}}: any) => {
  const data: any = JSON.parse(videoObject?.frames ?? '{}');
  if(!data?.videoId) return <div/>


  return (
    <div className="w-full h-full">
      <RemotionThumbnail data={data} />
    </div>
  );
};

export default VideoRemotionComponentPlayer;
