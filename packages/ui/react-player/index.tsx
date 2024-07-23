import React, { memo, useEffect, useState, forwardRef } from "react";
import ReactPlayerComponent from "react-player";
import axios from "axios";
import {useSearchParams} from "react-router-dom";

const ReactPlayer = forwardRef((props: any, ref) => {
  const [isHls, setIsHls] = useState(false);
  const [url, setUrl] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {

    getVideoUrl();
    return () => {

    }
  }, [props?.url]);

  const  isSafari = () => {
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome|CriOS|Chromium/.test(ua) && /Mac|iPad|iPhone|iPod/.test(ua);
  }

  const getVideoUrl = async () => {
    if(props?.url?.split?.('asset/video/')?.[1]) {
      const res = await axios.get(`${import.meta.env.VITE_API}/asset/video-url/${props?.url?.split?.('asset/video/')?.[1]}`).then((a) => a?.data?.url).catch(() => undefined)

      if(res) {
        setUrl(res)
        if(isSafari() || searchParams.get('iap').toString?.() === 'true') {
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
  };

  return url ? <ReactPlayerComponent {...playerProps} /> : <div/>;
});

export default ReactPlayer
