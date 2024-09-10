import React, { memo, useEffect, useState, forwardRef } from "react";
import ReactPlayerComponent from "react-player";
import axios from "axios";
import {useSearchParams} from "react-router-dom";

const ReactPlayer = forwardRef((props: any, ref: any) => {
  const [isHls, setIsHls] = useState(false);
  const [url, setUrl] = useState('');
  const [orientation, setOrientation] = useState<string>('');
  const [searchParams] = useSearchParams();
  useEffect(() => {

    getVideoUrl();
    return () => {

    }
  }, [props?.url]);

  const handleReady = () => {
    // Ensure the player is loaded and the underlying video element is accessible
    const player = ref.current;
    if (player && player.getInternalPlayer()) {
      const videoElement: HTMLVideoElement = player.getInternalPlayer() as HTMLVideoElement;
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;

      if (aspectRatio > 1) {
        setOrientation('landscape')
        props?.setOrientation?.('landscape')
      } else if (aspectRatio < 1) {
        setOrientation('vertical')
        props?.setOrientation?.('vertical')
      }
    }
  };

  const  isSafari = () => {
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome|CriOS|Chromium/.test(ua) && /Mac|iPad|iPhone|iPod/.test(ua);
  }

  const getVideoUrl = async () => {
    if(props?.url?.split?.('asset/video/')?.[1]) {
      const res = await axios.get(`${import.meta.env.VITE_API}/asset/video-url/${props?.url?.split?.('asset/video/')?.[1]}`).then((a) => a?.data?.url).catch(() => undefined)

      if(res) {
        setUrl(res)
        if(isSafari() || (searchParams?.get?.('iap') ?? '').toString?.() === 'true') {
          setIsHls(false)
        } else {
          setIsHls(containsM3U8(res))
        }
      }
    } else {
      setUrl(props?.url)
    }
  }

  const containsM3U8 = (str: string)  => {
    const regex = /\.m3u8/;
    return regex.test(str);
  }


  const handleError = (error?: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => {
    props?.onError?.(error, data, hlsInstance, hlsGlobal);
    if (hlsInstance && error === 'hlsError') {
      setIsHls(false);
    }

    setTimeout(() => {
      handleReady()
    }, 80)
  };

  const playerProps = {
    ...(props ?? {}),
    ref,
    url,
    onError: handleError,
    config: {
      ...props.config,
      youtube: {
        ...(props.config?.youtube ?? {}),
        embedOptions: {
          ...(props.config?.youtube?.embedOptions ?? {}),
          allowFullScreen: 'allowfullscreen',
          allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;fullscreen;"
        },
        playerVars: {
          ...(props.config?.youtube?.playerVars ?? {}),
          showinfo: 1,
          playsinline: 1,
          allowFullScreen: 'allowfullscreen',
          allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;fullscreen;"
        },
        onUnstarted: () => {
          props.config?.youtube?.onUnstarted?.()
          setTimeout(() => {
            handleReady()
          }, 80)
        }
      },
      file: {
        ...props.config?.file,
        forceHLS: isHls,
      }
    },
    onStart: () => {
      props?.onStart?.();
      setTimeout(() => {
        handleReady()
      }, 80)
    },
    onReady: () => {
      props?.onReady?.();
      setTimeout(() => {
        handleReady()
      }, 80)
    },
    onBuffer: () => {
      props?.onBuffer?.();
      setTimeout(() => {
        handleReady()
      }, 80)
    }
  };

  return url ? (
    <ReactPlayerComponent {...playerProps} />
  ) : <div/>;
});

export default ReactPlayer
