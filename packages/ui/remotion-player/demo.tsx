import {
  AbsoluteFill,
  Img,
  staticFile,
  Audio,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Series
} from "remotion";
import React, {useEffect, useMemo, useState} from "react";

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

const VideoFrame: React.FC<{ frameData: any; }> = ({frameData}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

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
    <AbsoluteFill style={{background: '#222'}}>
      {frameData.type === 'VIDEO' ? (
        <Video
          playsInline
          pauseWhenBuffering
          playbackRate={1}
          preload="auto"
          muted={false}
          volume={1}
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
      <SubtitleOverlay text={frameData.text}/>
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
        justifyContent: 'end',
        padding: '0 30px 180px 30px',
        zIndex: 3,
      }}
    >
      <EnterpriseText text={text}/>
    </AbsoluteFill>
  );
};

const isVideo = (url: string) => url?.match(/\.(mp4|mov|webm|mkv)$/i);

const VideoAvatarFrame: React.FC<{ voiceUrl?: string;}> = ({voiceUrl = undefined}) => {
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
        <Video
          pauseWhenBuffering
          playsInline
          playbackRate={1}
          volume={1}
          preload="auto"
          muted={false}
          src={voiceUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

interface VideoData {
  frames: any[];
  musicUrl?: string;
  voiceUrl?: string;
}

export const estimateAudioDuration = (text: string, wordsPerMinute?: number) => {
  // Remove extra whitespace and normalize text
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  const charCount = normalizedText.length;

  // Using baseline: 84 chars ≈ 5 seconds
  // So 1 char ≈ 0.0595 seconds
  const CHARS_PER_SECOND = 84 / 4.5; // ≈ 16.8 chars per second

  if (wordsPerMinute) {
    // If WPM is provided, use that for calculation
    const averageWordLength = 4.5; // Average English word length
    const charsPerMinute = wordsPerMinute * averageWordLength;
    const charsPerSecond = charsPerMinute / 60;
    return charCount / charsPerSecond;
  }

  // Calculate duration using baseline ratio
  const estimatedDuration = charCount / CHARS_PER_SECOND;

  // Add a small buffer for very short texts (minimum 1 second)
  return Math.max(1, estimatedDuration);
};

export const estimateAudioDurationWithFrames = (text: string, fps: number = 30) => {
  const duration = estimateAudioDuration(text);
  const frames = Math.ceil(duration * fps);

  return {
    duration,
    frames,
    durationInFrames: frames
  };
};

export const MyComposition: React.FC<{ data?: VideoData}> = ({
                                                                                               data: videoData,
                                                                                             }) => {
  const {fps} = useVideoConfig();

  const musicUrl = videoData?.musicUrl;
  const voiceUrl = videoData?.voiceUrl;

  const frameDurations = useMemo(() => videoData?.frames?.reduce((arr, frame) => {
    const a = estimateAudioDurationWithFrames(frame.text, fps)
    return [
      ...arr,
      {
        ...frame,
        duration: a?.durationInFrames,
      }
    ]
  }, []), [videoData])

  console.log(frameDurations.reduce((arr: number, frame: any) => arr+frame.duration, 0))

  return (
    <AbsoluteFill>
      <Series>
      {/* Nhạc nền */}
      {(musicUrl && !isVideo(voiceUrl)) && <Audio src={musicUrl} volume={1} playsInline loop pauseWhenBuffering/>}

      {/* Hiển thị từng frame */}
      {frameDurations.map((frame: any, index: number) => {

        return (
          <Series.Sequence durationInFrames={frame.duration} key={index}>
            <VideoFrame frameData={frame}/>
          </Series.Sequence>
        )
      })}
      </Series>
      {voiceUrl && (
        <AbsoluteFill style={{
          display: 'flex',
          justifyContent: 'end',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          zIndex: 0
        }}>
          <img
            src="https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/teachizi/background/pa.png"
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'cover'
            }}
          />
        </AbsoluteFill>
      )}
      {/* Avatar hoặc Video voiceUrl */}
      {voiceUrl &&
        (isVideo(voiceUrl) ? (
          <VideoAvatarFrame voiceUrl={voiceUrl}/>
        ) : (
          <Audio src={voiceUrl} volume={1} preload="auto" playsInline pauseWhenBuffering/>
        ))}
    </AbsoluteFill>
  );
};
