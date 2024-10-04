import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { delayRender, continueRender, cancelRender, useVideoConfig, AbsoluteFill, useCurrentFrame } from "remotion";
import LottieCharacterRemotion from "./lottie-character";

interface LottieSpriteProps {
  items: string[];
  width?: number | string;
  height?: number | string;
  transitionDuration?: number;
  minDuration?: number;
  isPlaying?: boolean;
}

const LottieSprite: React.FC<LottieSpriteProps> = ({
                                                     items,
                                                     width = '100%',
                                                     height = '100%',
                                                     transitionDuration = 500,
                                                     minDuration = 5000,
                                                     isPlaying = true
                                                   }) => {
  const [handle] = useState(() => delayRender());
  const [preloadedAnimations, setPreloadedAnimations] = useState<LottieAnimationData[]>([]);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const memoizedItems = useMemo(() => items, [items.join(',')]);

  useEffect(() => {
    let isMounted = true;
    const preloadAnimations = async () => {
      try {
        const loadedAnimations = await Promise.all(
          memoizedItems.map(url => fetch(url).then(res => res.json()))
        );
        if (isMounted) {
          setPreloadedAnimations(loadedAnimations);
          continueRender(handle);
        }
      } catch (err) {
        if (isMounted) {
          cancelRender(err);
        }
      }
    };

    preloadAnimations();
    return () => { isMounted = false; };
  }, [memoizedItems, handle]);

  if (preloadedAnimations.length === 0) {
    return null;
  }

  const minDurationInFrames = minDuration / 1000 * fps;
  const currentAnimationIndex = Math.floor(currentFrame / minDurationInFrames) % preloadedAnimations.length;
  const transitionProgress = (currentFrame % minDurationInFrames) / (transitionDuration / 1000 * fps);

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      {preloadedAnimations.map((animationData, index) => {
        const isCurrentAnimation = index === currentAnimationIndex;
        const isNextAnimation = index === (currentAnimationIndex + 1) % preloadedAnimations.length;
        let opacity = 0;

        if (isCurrentAnimation) {
          opacity = Math.max(0, 1 - transitionProgress);
        } else if (isNextAnimation) {
          opacity = Math.min(1, transitionProgress);
        }

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity,
              transition: `opacity ${transitionDuration}ms ease-in-out`,
            }}
          >
            <Lottie
              animationData={animationData}
              loop
              playbackRate={1}
              direction={isPlaying ? 'forward' : 'backward'}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        );
      })}
    </div>
  );
};

interface VideoConfigRemotion {
  avatarTemplate?: string;
}

const GifOverlay: React.FC<{ videoConfig?: VideoConfigRemotion; isPlaying?: boolean }> = ({ videoConfig, isPlaying = true }) => {
  const [size, setSize] = useState(460);
  const { width, height } = useVideoConfig();

  useEffect(() => {
    const smallerDimension = Math.min(width, height);
    setSize(Math.max(smallerDimension * 0.7, 200));
  }, [width, height]);

  const lottieItems = useMemo(() => {
    if (!videoConfig?.avatarTemplate) return [];
    return [1, 2, 3, 4].map(i =>
      `https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/lottie-avatar/${videoConfig.avatarTemplate ?? 'working_professionals/male'}/${i}.json`
    );
  }, [videoConfig?.avatarTemplate]);

  return (
    <AbsoluteFill style={{ zIndex: 2 }}>
      <div
        style={{
          position: 'absolute',
          width: `${size}px`,
          height: `${size}px`,
          bottom: `-${size * 0.05}px`,
          right: `-${size * 0.15}px`,
          opacity: 1,
        }}
      >

        {
          videoConfig?.avatarTemplate && ['male_1.json', 'female_1.json'].includes(videoConfig?.avatarTemplate) && (
            <LottieCharacterRemotion url={`https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/lottie-avatar/working_professionals/male/1.json`}/>
          )
        }

        {
          videoConfig?.avatarTemplate && !['male_1.json', 'female_1.json'].includes(videoConfig?.avatarTemplate) && (
            <LottieSprite
              items={lottieItems}
              transitionDuration={1000}
              minDuration={5000}
              isPlaying={isPlaying}
            />
          )
        }
      </div>
    </AbsoluteFill>
  );
};

export { LottieSprite, GifOverlay };
