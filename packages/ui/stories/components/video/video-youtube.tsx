import ReactPlayer from "../../../react-player";
import getYouTubeID from "get-youtube-id";
import {css} from "@emotion/react";
import useWindowsResize from "../../../../hook/use-windows-resize";
import {Slider} from "antd";
import Button from "../../../button";
import {PauseOutlined, PlayCircleOutlined,FullscreenOutlined} from "@ant-design/icons";
import {SoundIcon} from "../soundIcon";
import {useEffect, useMemo, useRef, useState} from "react";
import { useInView } from 'react-intersection-observer';
import styles from './Video.styles.module.css'
import {getVideo} from "../../../../../utils/media";
import Typewriter from "./typewriter";
import { useStoriesContext } from "../../hooks";

type VideoYoutubeContextProps = {
  media?: any;
  className?: string;
  isMuted?: boolean;
  isPaused?: boolean;
  setMute?: any;
  onPause?: any;
  effectSounds?: any;
  fullScreen?: boolean;
}

const key = 'RSIsMute';
const WINDOW: any = typeof window === 'undefined' ? {} : window;

const VideoYoutubeContext = ({media, className = '', ...props}: VideoYoutubeContextProps) => {
  const { setIsClickPaused, isClickPaused, changeOrientationContext, stories, currentIndex } = useStoriesContext();
  const [showDiv, setShowDiv] = useState<boolean>(false);
  const {width, height} = useWindowsResize()
  const [progress, changeProgress] = useState(0);
  const refVideo: any = useRef();
  const [isLocalMuted,  changeLocalMuted] = useState(WINDOW?.localStorage?.getItem(key) === 'true')
  const [isLocalPaused,  changeLocalPause] = useState(true)
  const [showLoader, setShowLoader] = useState(false);
  const [isOnUnstarted, changeIsOnUnstarted] = useState(false);
  const [isShowingControls, showingControls] = useState(false);
  const [blurControlVideo, setBlurControlVideo] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0
  });

  const isLocalMutedRef = useRef<boolean>(false);
  const [currentTime, changeCurrentTime] = useState(0)
  const [orientation, setOrientation] = useState<string>('');
  const timerRef: any = useRef<undefined>();

  const handleProgress = (state: any) => {
    changeCurrentTime(state.playedSeconds);
  };

  useEffect(() => {
    if(orientation !== 'vertical') return
    document.addEventListener('touchstart', resetTimer);
    startTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      document.removeEventListener('touchstart', resetTimer);
    };
  }, [orientation]);

  function startTimer() {
    timerRef.current = setTimeout(() => setShowDiv(true), 3000);
  }

  function resetTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShowDiv(false);
    startTimer();
  }

  useEffect(() => {
    isLocalMutedRef.current = isLocalMuted
  }, [isLocalMuted]);

  useEffect(() => {
    if(inView) {
      changeLocalPause(false)
    } else {
      changeLocalPause(true)
    }
  }, [inView]);

  useEffect(() => {
    if(media?.url) {
      setShowLoader(true);

      (window as any).onMute = () => {
        props?.effectSounds?.select?.();
        props?.setMute?.(!isLocalMutedRef.current);
        changeLocalMuted(!isLocalMutedRef.current);
        WINDOW?.localStorage?.setItem(key, String(!isLocalMutedRef.current));
      }
    }
  }, [media?.url]);

  const checkURL = (url: string) => {
    const searchString = 'api-v2.trainizi.com';
    return url.includes(searchString);
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', (event) => {
      if (!document.fullscreenElement) {
       showingControls(false)
        let elem = refVideo.current?.player?.player?.player
        // if(['video', 'VIDEO_MEDIA'].includes(media?.type ?? '')) {
        //   elem = elem?.g;
        // }

        if (elem) {
          elem.controls = false;
          try {
            elem.style.objectFit = orientation === 'landscape' ? 'contain' : 'cover'
          } catch {

          }
        }
      }
    });
    return () => {
      document.removeEventListener('fullscreenchange', (event) => {

      });
    }
  }, [orientation, refVideo]);

  const handlePauseVideo = (e: any) => {
    if (!showLoader && !isOnUnstarted) {
      e.stopPropagation();
      setBlurControlVideo(!blurControlVideo)
      props?.effectSounds?.select?.();
      changeLocalPause(!isLocalPaused)
      setIsClickPaused(!isClickPaused)
    } else {
      e.stopPropagation();
      props?.effectSounds?.select?.();
      changeLocalPause(!isLocalPaused)
      changeIsOnUnstarted(false)
    }
  }

  const isFullscreenLayout = useMemo(() => props?.fullScreen === true, [props?.fullScreen]);

  return (
    <div
      onClick={handlePauseVideo}
      ref={ref}
      css={css`
          ${isFullscreenLayout ? `` : `aspect-ratio: ${orientation === 'vertical' ? 9/16 : 16/9};`}
      `}
      className={`w-full h-full relative flex items-center justify-center rounded-lg video-frame animate__animated animate__fadeIn animate__fast ${className} ${!showLoader ? 'cursor-pointer': ''}`}>
      <div
        css={css`
            video {
                ${isFullscreenLayout ? `object-fit: ${orientation === 'landscape' ? 'contain' : 'cover'};` : `object-fit: ${orientation === 'vertical' ? 'contain' : 'cover'};`}
            }

            width: 100%;
            height: 100%;
            position: relative;
  
            iframe {
                pointer-events: ${isShowingControls ? 'auto' : 'none'};
            }

            .player-wrappers video::-webkit-media-text-track-display,
            .video-container video::-webkit-media-text-track-display
            {
                position: absolute;
                bottom: 20%; /* Adjust this to change the vertical position */
                width: 100%;
                text-align: center;
            }

            .player-wrappers video::cue,
            .video-container video::cue  {
                background: rgba(0, 0, 0, 0); /* Background color of the caption */
                color: white; /* Text color of the caption */
                font-size: 1.2em; /* Font size of the caption */
                padding: 0.2em; /* Padding around the caption text */
                border-radius: 5px;
            }
        `}
        className={`${['video', 'VIDEO_MEDIA'].includes(media?.type ?? '') ? 'video-container' : 'player-wrappers'} `}>
        {
          inView && (
            <ReactPlayer
              className={`${!['video', 'VIDEO_MEDIA'].includes(media?.type ?? '') ? 'w-full h-full' : 'react-player'}  player-custom`}
              onPause={() => {
                console.log('onPause');
              }}
              setOrientation={(e: string) => {
                setOrientation(e)
                changeOrientationContext(e)
              }}

              onStart={() => {
                if(isOnUnstarted) {
                  changeLocalPause(false)
                  changeIsOnUnstarted(false)
                }
              }}
              onReady={() => {
                setShowLoader(true)
                changeLocalPause(false)
              }}
              onError={(error: any) => {
                if(error?.name === 'NotAllowedError') {
                  changeIsOnUnstarted(true)
                  changeLocalPause(true)
                  setShowLoader(false)
                }
                console.log('onError', error);
              }}
              onEnded={() => {
                console.log('onEnded');
                changeLocalPause(true)
                setIsClickPaused(true)
                setBlurControlVideo(true)
              }}
              onBuffer={() => {
                console.log('onBuffer');
              }}
              style={{
                width: '100%',
                height: '100%',
              }}
              ref={refVideo}
              width="100%"
              height="100%"
              config={{
                youtube: {
                  embedOptions: {
                    allowFullScreen: 'allowfullscreen',
                    allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;fullscreen;"
                  },
                  playerVars: {
                    showinfo: 1,
                    playsinline: 1,
                    allowFullScreen: 'allowfullscreen',
                    allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;fullscreen;"
                  },
                  onUnstarted: () => {
                    console.log("onUnstarted")
                    changeIsOnUnstarted(true)
                    changeLocalPause(true)
                  }
                },
                file: {
                  attributes: {
                  },
                  // tracks: [
                  //   {
                  //     kind: "subtitles",
                  //     src: media?.subtitle,
                  //     srcLang: "en",
                  //     default: true,
                  //     label: "English"
                  //   },
                  // ]
                },
              }}
              progressInterval={100}
              onProgress={(e: any) => {
                if ((e?.played ?? 0) > 0) {
                  setShowLoader(false)
                }

                changeProgress(e?.played ?? 0);
                handleProgress(e)
              }}

              muted={isLocalMuted}
              controls={isShowingControls && blurControlVideo}
              loop={false}
              playing={!isLocalPaused}
              onClickPreview={() => {
              }}
              playsinline={true}
              url={
                ['video', 'VIDEO_MEDIA'].includes(media?.type ?? '')
                  ? `https://www.youtube.com/watch?v=${getYouTubeID(media?.url)}`
                  : getVideo(media?.url)
              }
            />
          )
        }
        {/*{*/}
        {/*  media?.subtitle && (*/}
        {/*    <Subtitles*/}
        {/*      {...{ currentTime }}*/}
        {/*      selectedsubtitle={{*/}
        {/*        file: media?.subtitle === 'https://trainizi.com/subtitle.vtt' ? 'https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/prod_video/subtitle+(1).vtt' : media?.subtitle,*/}
        {/*      }}*/}
        {/*    />*/}
        {/*  )*/}
        {/*}*/}

        {
          (media?.subText && checkURL(media?.url)) && (
            <div
              style={{
                position: 'absolute',
                top: '10%',
                zIndex: 20,
                left: 0,
                right: 0,
                padding: 8,
                opacity: 0.6
              }}
            >
              <Typewriter progress={currentTime} text={media?.subText}/>
            </div>
          )
        }

      </div>
      {
        isOnUnstarted && (
          <div className="flex fixed top-0 left-0 justify-center items-center bg-neutral-800/40 bottom-0 right-0 z-20">
            <Button
              variant="primary"
              csss={css`
                  z-index: 200;
                  width: 64px;
                  height: 64px;
              `}
              icon={isLocalPaused ? <PlayCircleOutlined style={{fontSize: 32}} rev={undefined}/> :
                <PauseOutlined style={{fontSize: 32}} rev={undefined}/>}
              onClick={() => {
                // props?.effectSounds?.select?.();
                // changeIsOnUnstarted(false)
                // changeLocalPause(!isLocalPaused)
              }}
            >
            </Button>
          </div>
        )
      }
      {
        (!isShowingControls) && (
          <>
            <div className="flex z-20 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Button
                csss={css`
                    width: 64px;
                    height: 64px;
                    background: black;
                    ${blurControlVideo ? 'opacity: 0.6' : 'opacity: 0' };
                `}
                // icon={isLocalPaused ? <PlayCircleOutlined style={{fontSize: 16}} rev={undefined}/> :
                //   <PauseOutlined style={{fontSize: 16}} rev={undefined}/>}
                icon={<PlayCircleOutlined style={{fontSize: 32}} rev={undefined}/>}
                onClick={(e) => {
                  // props?.onPause?.(!isLocalPaused);
                }}
              >
              </Button>
            </div>
            {
              !blurControlVideo && (
                <div
                  css={css`
                    .ant-slider {
                      margin: 0;
                    }
                    .ant-slider-track {
                      background-color: #743cff
                    }
                  `}
                  className="absolute -bottom-1 w-full z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Slider
                    className='w-full'
                    max={100}
                    min={0}
                    handleStyle={{
                      height: 8
                    }}
                    onChange={(e: any) => {
                      refVideo?.current?.seekTo?.(e * 0.01);
                      // handleSliderInteractionStart();
                      changeProgress(e * 0.01);
                    }}
                    onChangeComplete={() => {
                      // handleSliderInteractionEnd()
                    }}
                    css={css`

                    `}
                    step={1}
                    value={progress * 100}
                  />
                </div>
              )
            }
          </>

          // <div
          //   className={`flex z-20 bg-neutral-900 shadow rounded-lg items-center controls absolute left-0 right-0 bottom-[74px] px-4 lg:py-2 py-0.5 mx-4`}>
          //   <Button
          //     csss={css`
          //         width: 36px;
          //         height: 36px;
          //         background: rgba(255, 255, 255, 0.2);
          //         @media screen and (max-width: 768px) {
          //             width: 30px;
          //             height: 30px;
          //         }
          //     `}
          //     icon={isLocalPaused ? <PlayCircleOutlined style={{fontSize: 16}} rev={undefined}/> :
          //       <PauseOutlined style={{fontSize: 16}} rev={undefined}/>}
          //     onClick={(e) => {
          //       e.stopPropagation();
          //       // props?.onPause?.(!isLocalPaused);
          //       props?.effectSounds?.select?.();
          //       changeLocalPause(!isLocalPaused)
          //     }}
          //   >
          //   </Button>
          //   <Slider
          //     className='w-full mx-4 flex-1'
          //     max={100}
          //     min={0}
          //     handleStyle={{
          //       height: 8
          //     }}
          //     onChange={(e: any) => {
          //       refVideo?.current?.seekTo?.(e * 0.01);
          //       // handleSliderInteractionStart();
          //       changeProgress(e * 0.01);
          //     }}
          //     onChangeComplete={() => {
          //       // handleSliderInteractionEnd()
          //     }}
          //     css={css`

          //     `}
          //     step={1}
          //     value={progress * 100}
          //   />
          //   <Button
          //     csss={css`
          //         width: 36px;
          //         height: 36px;
          //         background: transparent;

          //         @media screen and (max-width: 768px) {
          //             width: 30px;
          //             height: 30px;
          //         }
          //     `}
          //     variant="primary"
          //     icon={<SoundIcon type={(isLocalMuted) ? 'off' : 'on'}/>}
          //     onClick={(e) => {
          //       e.stopPropagation();
          //       props?.effectSounds?.select?.();
          //       props?.setMute?.(!isLocalMuted);
          //       changeLocalMuted(!isLocalMuted);
          //       WINDOW?.localStorage?.setItem(key, String(!isLocalMuted));
          //     }}
          //   >
          //     {/*{!isMuted ? <i className='fa fa-volume'></i> : <i className='fa fa-volume-mute'></i>}*/}
          //   </Button>

          //   {/*<Dropdown className='ml-3'*/}
          //   {/*          overlay={*/}
          //   {/*            <Menu>*/}
          //   {/*              <Menu.Item onClick={() => handleSpeedChange(0.5)}*/}
          //   {/*                         className="text-white font-bold">0.5x</Menu.Item>*/}
          //   {/*              <Menu.Item onClick={() => handleSpeedChange(1)} className="text-white font-bold">1x</Menu.Item>*/}
          //   {/*              <Menu.Item onClick={() => handleSpeedChange(1.5)}*/}
          //   {/*                         className="text-white font-bold">1.5x</Menu.Item>*/}
          //   {/*              <Menu.Item onClick={() => handleSpeedChange(2)} className="text-white font-bold">2x</Menu.Item>*/}
          //   {/*            </Menu>*/}
          //   {/*          }*/}
          //   {/*          trigger={['click']}*/}
          //   {/*>*/}
          //   {/*  <Button>*/}
          //   {/*    {translationPlatform('speed')} {playbackRate}x <DownOutlined/>*/}
          //   {/*  </Button>*/}
          //   {/*</Dropdown>*/}
          //   {
          //     !['video', 'VIDEO_MEDIA'].includes(media?.type ?? '') && (
          //       <Button
          //         csss={css`
          //         width: 36px;
          //         height: 36px;
          //         background: transparent;
          //         margin-left: 16px;

          //         @media screen and (max-width: 768px) {
          //             width: 30px;
          //             height: 30px;
          //         }
          //     `}
          //         variant="primary"
          //         icon={<FullscreenOutlined rev={undefined}/>}
          //         onClick={() => {
          //           let elem = refVideo.current?.player?.player?.player
          //           // if(['video', 'VIDEO_MEDIA'].includes(media?.type ?? '')) {
          //           //   elem = elem?.g;
          //           // }
          //           if (elem) {
          //             showingControls(true)
          //             elem.controls = true;
          //             try {
          //               elem.style.objectFit = 'contain'
          //             } catch (e) {}
          //             setTimeout(() => {
          //               if (elem.requestFullscreen) {
          //                 elem.requestFullscreen();
          //               } else if (elem.webkitRequestFullscreen) { /* Safari */
          //                 elem.webkitRequestFullscreen();
          //               } else if (elem.msRequestFullscreen) { /* IE11 */
          //                 elem.msRequestFullscreen();
          //               }
          //             }, 200)
          //           }
          //         }}
          //       >
          //         {/*{!isMuted ? <i className='fa fa-volume'></i> : <i className='fa fa-volume-mute'></i>}*/}
          //       </Button>
          //     )
          //   }
          // </div>
        )
      }

      {(showLoader) && (
        <div className={styles.loaderWrapper}>
          <div className={styles.loader}/>
        </div>
      )}
      {
        (showDiv) && (
          <div className="z-40 absolute pointer-events-none select-none lg:bottom-16 bottom-8 left-0 right-0 overflow-y-auto overflow-x-auto justify-center flex items-center">
            <img src="/icons/slide-animation-swipe.gif" className="w-16 h-16 object-contain" />
          </div>
        )
      }
    </div>
  )
}


export default VideoYoutubeContext
