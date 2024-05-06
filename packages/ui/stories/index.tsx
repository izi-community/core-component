import {StoriesContext} from './contexts';
import {Actions, Progress, Story} from './components';
import {IStoryProps, IStoryIndexedObject, IStoryContext} from './types';
import {ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import * as hooks from './hooks';
import styles from './styles.module.css';
import * as utilities from './utilities';
import {debounce} from "lodash";
import {css} from "@emotion/react";
import {useSearchParams} from "react-router-dom";
import 'swiper/css';
import useMobile from '../../hook/use-mobile';

const WrapperPlayChild = ({children, selectedStory, classNames = {}, width, height, searchParams}: {children: ReactNode, height: any, width: any, searchParams?: any, classNames?: any, selectedStory?: IStoryIndexedObject}) => {
  const { direction } = hooks.useStoriesContext();
  const directionRef = useRef<string>()
  const {mode} = useMobile()

  const animation = useMemo(() => {
    if(mode === 'mobile') return ''

    if(direction === 'right') {
      return 'animate__fadeOutLeft'
    }

    if(direction === 'left') {
      return 'animate__fadeOutRight'
    }

    return ''
  }, [direction, selectedStory.index, mode])

  return (
    <div
      id="wrapper-play-id-child"
      style={{width, height}}
      css={css`
              overflow: hidden;
              @media screen and (max-width: 375px) {
                  padding-bottom: ${searchParams.get('footer') ? 0 : 51}px !important;
              }
          `}
      className={`${styles.main} ${classNames?.main || ''} z-[1] animate__animated animate__faster ${animation}`}
    >
      {children}
    </div>
  )
}

const StoryWrapper = ({

                        effectSounds,
                        autoPlay,
                        isRunningAnimation,
                        stories,
                        height,
                        width,
                        disabledNext,
                        handleNextClick,
                        handlePrevClick,
                        handlePause,
                        handleResume,
                        storiesWithIndex,
                        isPaused,
                        selectedStory,
                        currentIndex
                      }: {
  handleNextClick: any,
  handlePrevClick: any,
  handlePause: any,
  handleResume: any,
  isRunningAnimation: any,
  storiesWithIndex: IStoryIndexedObject[],
  selectedStory: IStoryIndexedObject | undefined,
  isPaused: boolean,
} & IStoryProps) => {
  const {mode} = useMobile()
  const swiperRef = useRef(null);
  const debouncedNextClick = debounce(() => handleNextClick(), 0);
  const debouncedPrevClick = debounce(() => handlePrevClick(), 0);

  if(!selectedStory) return <div/>

  return (
    <Story
      effectSounds={effectSounds}
      disabledNext={isRunningAnimation}
      key={selectedStory.index}
      onPause={handlePause}
      onResume={handleResume}
      story={selectedStory}
      isPaused={isPaused}
    >
      <Actions
        onNextClick={debouncedNextClick}
        onPrevClick={debouncedPrevClick}
        onPause={handlePause}
        onResume={handleResume}
      />
    </Story>
  )
  // if (mode === 'desktop') {
  //
  //   return (
  //     <Story
  //       effectSounds={effectSounds}
  //       disabledNext={isRunningAnimation}
  //       key={selectedStory.index}
  //       onPause={handlePause}
  //       onResume={handleResume}
  //       story={selectedStory}
  //       isPaused={isPaused}
  //     >
  //       <Actions
  //         onNextClick={debouncedNextClick}
  //         onPrevClick={debouncedPrevClick}
  //         onPause={handlePause}
  //         onResume={handleResume}
  //       />
  //     </Story>
  //   )
  // }
  //
  // console.log({currentIndex, disabledNext})
  // useEffect(() => {
  //   swiperRef.current?.slideTo?.(currentIndex)
  // }, [currentIndex]);
  //
  // return (
  //   <Swiper
  //     css={css`
  //         height: ${height};
  //         width: ${width};
  //         z-index: 0;
  //     `}
  //     effect="fade"
  //     spaceBetween={0}
  //     initialSlide={0}
  //     slidesPerView={1}
  //     slidesPerGroup={1}
  //     touchReleaseOnEdges
  //     lazyPreloadPrevNext={0}
  //     longSwipes={false}
  //     edgeSwipeDetection
  //     threshold={10}
  //     grabCursor={true}
  //     modules={[Scrollbar, Navigation]}
  //     scrollbar={{
  //       snapOnRelease: true
  //     }}
  //     onTouchMove={(swiper: SwiperProps, event: SwiperEvents) => {
  //       const screenWidth = window.innerWidth;
  //       if (disabledNext) {
  //         if ((swiper.touches?.diff < 0) && (Math.abs(swiper.touches?.diff) > screenWidth * 0.1) && swiper.swipeDirection === 'next') {
  //           console.log("onTouchMove", swiper.activeIndex, swiper.swipeDirection, dayjs().format("DD/MM/YYYY HH:ss"))
  //           event.preventDefault();
  //           handleNextClick()
  //         }
  //       }
  //     }}
  //
  //     onTouchStart={(swiper: SwiperProps, event: SwiperEvents) => {
  //       if (swiper.swipeDirection === 'next' && swiper.activeIndex === ((stories ?? []).length - 1)) {
  //         console.log("onTouchStart", swiper.activeIndex, swiper.swipeDirection,  dayjs().format("DD/MM/YYYY HH:ss"))
  //         event.preventDefault();
  //         handleNextClick()
  //       }
  //     }}
  //
  //     onSlideChange={(swiper: SwiperProps) => {
  //       if (swiper.activeIndex !== currentIndex && swiper.swipeDirection) {
  //         console.log("onTransitionEnd", swiper.activeIndex, swiper.swipeDirection,  dayjs().format("DD/MM/YYYY HH:ss"))
  //         if (swiper.swipeDirection === 'prev') {
  //           debouncedPrevClick();
  //         } else {
  //           debouncedNextClick()
  //         }
  //       }
  //     }}
  //
  //     allowSlideNext={disabledNext === false}
  //     navigation={{}}
  //     // onSlideChange={(swiper: SwiperProps) => {
  //     //   if (swiper.swipeDirection === 'prev') {
  //     //     debouncedPrevClick();
  //     //   } else {
  //     //     debouncedNextClick()
  //     //   }
  //     // }}
  //     onSwiper={(swiper: SwiperProps) => {
  //       swiperRef.current = swiper; // Assign swiper instance to ref
  //       (window as any).SWIPPER = swiper
  //     }}
  //   >
  //     {
  //       stories?.map((curr, idx) => (
  //         <SwiperSlide
  //           key={`story_${idx}`}
  //           className="lg:pb-[64px] pb-[56px]"
  //           style={{width: '100%', height: '100%'}}
  //         >
  //           <Story
  //             effectSounds={effectSounds}
  //             disabledNext={isRunningAnimation}
  //             key={idx}
  //             onPause={handlePause}
  //             onResume={handleResume}
  //             story={storiesWithIndex[idx]}
  //             isPaused={isPaused}
  //           >
  //           </Story>
  //         </SwiperSlide>
  //       ))
  //     }
  //   </Swiper>
  // )
}

export default function Stories({
                                  stories = [],
                                  width = '100%',
                                  height = '100%',
                                  onStoryChange = () => {
                                  },
                                  currentIndex = 0,
                                  defaultDuration = 10000,
                                  onAllStoriesEnd = () => {
                                  },
                                  onStoriesStart = () => {
                                  },
                                  classNames = {},
                                  pauseStoryWhenInActiveWindow = true,
                                  autoPlay = true,
                                  disabledNext = false,
                                  effectSounds = {},
                                  children,
                                }: IStoryProps): JSX.Element | null {
  const {mode} = useMobile()
  const [searchParams] = useSearchParams();
  const storiesWithIndex: IStoryIndexedObject[] = useMemo(() => {
    return utilities.transformStories(stories, defaultDuration);
  }, [stories, defaultDuration]);

  const [selectedStory, setSelectedStory] = useState<
    IStoryIndexedObject | undefined
  >();

  const [direction, changeDirection] = useState<string>('')
  const selectedStoryRef = useRef<IStoryIndexedObject | undefined>()
  const disabledNextRef = useRef<boolean | undefined>()
  const firstStoryIndex = 0;
  const lastStoryIndex = stories.length - 1;
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const hasCalledEndedCb = useRef<any>(false);
  const hasCalledStartedCb = useRef<any>(false);
  const [isRunningAnimation, runAnimation] = useState<string>('')

  useEffect(() => {
    // if(disabledNext && isRunningAnimation) {
    //   runAnimation('')
    // }
  }, [currentIndex, disabledNext, isRunningAnimation]);

  useEffect(() => {
    setIsPaused(!autoPlay)
  }, [autoPlay]);

  useEffect(() => {
    disabledNextRef.current = disabledNext
  }, [disabledNext]);

  useEffect(() => {
    if (!hasCalledStartedCb.current) {
      hasCalledStartedCb.current = true;
      onStoriesStart();
    }
  }, [onStoriesStart]);

  useEffect(() => {
    const story = storiesWithIndex[currentIndex];
    if (story) {
      selectedStoryRef.current = story
      setSelectedStory(story);
    }
  }, [currentIndex, stories]);

  function handleNextClick() {
    effectSounds?.select?.();
    console.log("next", disabledNextRef.current)
    if (disabledNextRef.current) {
      runAnimation((new Date()).getTime().toString())
      setTimeout(() => {
        runAnimation('')
      }, 1000)
      return
    }

    changeDirection('right')
    // if (selectedStoryRef?.current?.index === lastStoryIndex && hasCalledEndedCb.current) {
    //   onAllStoriesEnd();
    //   return;
    // }
    //
    // if (!hasCalledEndedCb.current && selectedStoryRef?.current?.index === lastStoryIndex) {
    //   hasCalledEndedCb.current = true;
    // }

    if (!selectedStoryRef.current) {
      onStoryChange(storiesWithIndex[0].index);
    } else {
      onStoryChange(selectedStoryRef.current?.index + 1);
    }
    // setSelectedStory((prev) => {
    //   if (!prev) {
    //     return storiesWithIndex[0];
    //   }
    //   const newIndex = prev?.index + 1;
    //   return storiesWithIndex[newIndex];
    // });
  }

  function handlePrevClick() {
    changeDirection('left')
    effectSounds?.select?.();
    if (selectedStoryRef?.current?.index === firstStoryIndex) {
      return;
    }

    if (!selectedStoryRef.current) {
      onStoryChange(storiesWithIndex[0].index);
    } else {
      onStoryChange(selectedStoryRef.current?.index - 1);
    }
    // setSelectedStory((prev) => {
    //   if (!prev) {
    //     return storiesWithIndex[0];
    //   }
    //   const newIndex = prev?.index - 1;
    //   return storiesWithIndex[newIndex];
    // });
  }

  function handlePause() {
    setIsPaused(true);
  }

  function handleResume() {
    setIsPaused(false);
  }

  // useEffect(() => {
  //   if (selectedStory) {
  //     onStoryChange(selectedStory.index);
  //     selectedStoryRef.current = selectedStory
  //   }
  // }, [selectedStory]);

  hooks.usePausableTimeout(
    () => {
      if (autoPlay) {
        handleNextClick();
      }
    },
    selectedStory?.calculatedDuration ?? null,
    isPaused,
  );

  hooks.useWindowVisibility((isWindowInFocus) => {
    if (pauseStoryWhenInActiveWindow) {
      setIsPaused(!isWindowInFocus);
    }
  });

  useEffect(() => {
    if (direction) {
      const timer = setTimeout(() => {
        changeDirection('')
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [direction]);

  const onChangeDirection = (a: string) => {
    changeDirection(a)
  }

  const contextValue: IStoryContext = {
    stories: storiesWithIndex,
    width,
    height,
    defaultDuration,
    isPaused,
    classNames,
    direction,
    changeDirection: onChangeDirection
  };

  if (!selectedStory) {
    return null;
  }

  return (
    <StoriesContext.Provider value={contextValue}>
      <div
        id="wrapper-play-id"
        style={{width, height, position: 'relative', margin: 'auto'}}
      >
        <WrapperPlayChild
          selectedStory={selectedStory}
          width={width}
          height={height}
          searchParams={searchParams}
          classNames={classNames}

        >
          <Progress activeStoryIndex={selectedStory.index} isPaused={isPaused}/>

          <StoryWrapper
            defaultDuration={defaultDuration}
            disabledNext={disabledNext}
            onAllStoriesEnd={onAllStoriesEnd}
            autoPlay={autoPlay}
            onStoriesStart={onStoriesStart}
            effectSounds={effectSounds}
            classNames={classNames}
            currentIndex={currentIndex}
            pauseStoryWhenInActiveWindow={pauseStoryWhenInActiveWindow}
            width={width}
            height={height}
            selectedStory={selectedStory}
            storiesWithIndex={storiesWithIndex}
            handleNextClick={handleNextClick}
            handlePause={handlePause}
            handlePrevClick={handlePrevClick}
            handleResume={handleResume}
            isPaused={isPaused}
            isRunningAnimation={isRunningAnimation}
            stories={stories}
            onStoryChange={onStoryChange}
          />
          {children}
        </WrapperPlayChild>

        {
          mode === 'desktop' && storiesWithIndex[currentIndex+1] && (
            <>
              <div
                css={css`
                    width: ${width};
                    height: ${parseInt(height?.replace('px', '')) * 0.95}px;
                    right: -20px;
                    background: linear-gradient(168.48deg, #cfddff, #b7b5b5 82.9999983311%);
                    top: 0;
                    bottom: 0;
                    position: absolute;
                    z-index: -10;
                    margin: auto;
                    border-radius: 24px;
                    transition: all ease-in-out 0.2s;
                    overflow: hidden;
                `}
                className="w-full z-0 h-full shadow">

              </div>
              <div
                css={css`
                    width: ${width};
                    height: ${parseInt(height?.replace('px', '')) * 0.9}px;
                    right: -40px;
                    background: linear-gradient(168.48deg, #cfddff, #919191 82.9999983311%);
                    top: 0;
                    bottom: 0;
                    position: absolute;
                    z-index: -13;
                    margin: auto;
                    transition: all ease-in-out 0.2s;
                    overflow: hidden;
                    border-radius: 24px;
                `}
                className="w-full z-0 h-full shadow">
              </div>
            </>
          )
        }
      </div>
    </StoriesContext.Provider>
  );
}
