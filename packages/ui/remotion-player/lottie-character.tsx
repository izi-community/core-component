import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

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

export default LottieCharacterRemotion
