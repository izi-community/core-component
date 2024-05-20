import React, { memo, useEffect, useState, forwardRef } from "react";
import ReactPlayerComponent from "react-player";

const ReactPlayer = forwardRef((props: any, ref) => {
  const [isHls, setIsHls] = useState(true);

  useEffect(() => {
    return () => {
      setIsHls(true); // Resets to true on unmount
    }
  }, []);

  const handleError = (error?: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => {
    props?.onError?.(error, data, hlsInstance, hlsGlobal);
    console.log(error, data, hlsInstance, hlsGlobal)
    if (hlsInstance && error === 'hlsError') {
      setIsHls(false);
    }
  };

  const playerProps = {
    ...(props ?? {}),
    ref,
    onError: handleError,
    config: {
      ...props.config,
      file: {
        ...props.config?.file,
        forceHLS: isHls,
      }
    },
    key: isHls ? "player-hls" : "player-none-hls"
  };

  return <ReactPlayerComponent {...playerProps} />;
});

export default ReactPlayer
