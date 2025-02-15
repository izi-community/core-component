import { AbsoluteFill, Img, staticFile, Audio, Sequence, Video, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import React, {useEffect, useState} from "react";
import { preloadAudio, preloadVideo } from "@remotion/preload";

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

const VideoFrame: React.FC<{ frameData: any;}> = ({frameData}) => {
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
      <SubtitleOverlay text={frameData.text} />
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

const isVideo = (url: string) => url?.match(/\.(mp4|mov|webm|mkv)$/i);

export const MyComposition: React.FC<{ data?: any; onReady?: (status: boolean) => void }> = ({ data: videoData, onReady }) => {
  const { fps } = useVideoConfig();
  const frameDuration = 4.5 * fps; // 4.5 giây mỗi frame

  const musicUrl = videoData?.videoConfig?.musicUrl;
  const voiceUrl = videoData?.videoConfig?.voiceUrl;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (musicUrl) preloadAudio(musicUrl);
    if (voiceUrl) isVideo(voiceUrl) ? preloadVideo(voiceUrl) : preloadAudio(voiceUrl);

    setLoaded(true);
    onReady?.(true);
  }, [musicUrl, voiceUrl, onReady]);

  if (!loaded) {
    return (
      <AbsoluteFill style={{ backgroundColor: "black", color: "white", justifyContent: "center", alignItems: "center" }}>
        Loading...
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* Nhạc nền */}
      {(musicUrl && !isVideo(voiceUrl)) && <Audio src={musicUrl} volume={1} playsInline loop pauseWhenBuffering />}

      {/* Hiển thị từng frame */}
      {videoData.frames.map((frame: any, index: number) => (
        <Sequence from={index * frameDuration} durationInFrames={frameDuration} key={index}>
          <VideoFrame frameData={frame} />
        </Sequence>
      ))}

      {/* Avatar hoặc Video voiceUrl */}
      {voiceUrl &&
        (isVideo(voiceUrl) ? (
          <Video
            pauseWhenBuffering
            playsInline
            playbackRate={1}
            volume={1}
            preload="auto"
            muted={false}
            src={voiceUrl}
            style={{
              position: "absolute",
              bottom: "10%",
              right: "5%",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
            }}
          />
        ) : (
          <Audio src={voiceUrl} volume={1} preload="auto" playsInline pauseWhenBuffering />
        ))}
    </AbsoluteFill>
  );
};
