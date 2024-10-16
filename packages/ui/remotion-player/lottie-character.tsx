import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender } from "remotion";

const LottieCharacterRemotion = ({url}: {url: string}) => {
  const [handle] = useState(() => delayRender(""));
  const [animationData, setAnimationData] = useState<any | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

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

  const handleAnimationLoaded = (animationItem: any) => {
    const totalFrames = animationItem.totalFrames;

    // Calculate playbackRate based on totalFrames
    let newPlaybackRate;
    if (totalFrames <= 100) {
      newPlaybackRate = 1;
    } else {
      newPlaybackRate = 1 + (totalFrames * 1) / 100;
    }

    if(newPlaybackRate > 4) {
      newPlaybackRate = 4
    }

    setPlaybackRate(newPlaybackRate);
  };

  if (!animationData) {
    return null;
  }

  return (
    <Lottie
      loop
      playbackRate={playbackRate}
      onAnimationLoaded={handleAnimationLoaded}
      animationData={animationData}
    />
  );
};

export default LottieCharacterRemotion;
