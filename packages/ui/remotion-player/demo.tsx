import { AbsoluteFill, Img, staticFile, Audio, Sequence, Video, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import React from "react";


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

// Thời gian mỗi frame hiển thị (5 giây)
const frameDuration = 4.5 * 30; // 5 giây * 30fps

export const MyComposition: React.FC = ({data: videoData}: {data?: any}) => {
  return (
    <AbsoluteFill>
      {/* Nhạc nền */}
      <Audio
        playbackRate={1}
        preload="auto"
        loop
        pauseWhenBuffering
        src={videoData.videoConfig.musicUrl} volume={1} playsInline/>

      {/* Hiển thị từng frame */}
      {videoData.frames.map((frame: any, index: any) => (
        <Sequence from={index * frameDuration} durationInFrames={frameDuration} key={index}>
          <VideoFrame frameData={frame} />
        </Sequence>
      ))}
      {/* Avatar (nếu bật) */}
      {videoData.videoConfig.voiceUrl && (
        <Video
          pauseWhenBuffering
          playsInline
          playbackRate={1}
          preload="auto"
          muted={false}
          src={videoData.videoConfig.voiceUrl}
          style={{
            position: "absolute",
            bottom: "10%",
            right: "5%",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
