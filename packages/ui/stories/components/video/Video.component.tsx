import { Fragment, useEffect, useRef, useState } from 'react';
import { IStoryComponentProps } from '../../types';
import * as hooks from '../../hooks';
import VideoYoutube from "@trainizi/core/packages/ui/stories/components/video/video-youtube";

const key = 'RSIsMute';
const WINDOW: any = typeof window === 'undefined' ? {} : window;
// WINDOW?.localStorage?.setItem(key, 'true');

export function Video(props: IStoryComponentProps) {
  const { isPaused } = hooks.useStoriesContext();
  const [isMuted, setIsMuted] = useState(
    WINDOW?.localStorage?.getItem(key) === 'true',
  );

  const [showLoader, setShowLoader] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function setMute(value: boolean) {
    WINDOW?.localStorage?.setItem(key, String(value));
    setIsMuted(value);
  }

  useEffect(() => {
    props.onPause();
    setShowLoader(true);
  }, []);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }
    if (isPaused && !videoRef.current.paused) {
      videoRef.current.pause();
      return;
    }
    videoRef.current.play().then(() => {
      if(WINDOW.localStorage.getItem(key) === 'true') {
        setMute(true);
      } else {
        setMute(false);
      }
    }).catch((e) => {
      if(WINDOW.localStorage.getItem(key) === 'true') {
        setMute(true);
      } else {
        setMute(false);
      }
      videoRef.current?.play();
    });
  }, [isPaused]);

  function handleLoad() {
    setTimeout(() => {
      props.onResume();
      setShowLoader(false);
    }, 4);
  }

  return (
    <Fragment>
      <VideoYoutube
        onPause={(e: any) => {
          if(e) {
            props?.onPause?.()
          } else {
            props?.onResume?.()
          }
        }}
        effectSounds={props?.effectSounds}
        setMute={setMute}
        fullScreen={props?.story?.fullscreen}
        isMuted={isMuted}
        isPaused={isPaused}
        indexSlide={props?.story?.index}
        media={{type: props?.story?.payload?.media?.type, videoConfig: props?.story?.payload?.videoConfig, data: props?.story?.payload?.media?.data, url: props.story.url, subtitle: props.story.subtitle, subText: props.story.subText}}
      />
      {/*<div className={styles.soundIcon} onClick={() => setMute(!isMuted)}>*/}
      {/*  <SoundIcon type={isMuted ? 'off' : 'on'}/>*/}
      {/*</div>*/}
      {
        props?.children
      }
    </Fragment>
  );
}
