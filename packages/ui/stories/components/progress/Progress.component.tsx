import {useStoriesContext} from '../../hooks';
import {css} from '@emotion/react'
import styles from './progress.styles.module.css';

import {CloseIcon} from "../closeIcon";
import {ReactNode, useMemo} from "react";
import { useSearchParams } from 'react-router-dom';

interface IProgressProps {
  activeStoryIndex: number;
  isPaused: boolean;
  onClick?: () => void;
  actions?: ReactNode[];
}

export function Progress(props: IProgressProps) {
  const {stories, orientation, classNames, currentIndex, setIsClickPaused} = useStoriesContext();
  const isVideo = stories?.[currentIndex]?.type === 'video' || orientation === 'vertical'
  const [searchParams] = useSearchParams();

  const isAueuCourse = useMemo(() => searchParams?.get?.('client_id') === 'AUEU_COURSE', [searchParams])
  const isAueuSurvey = useMemo(() => searchParams?.get?.('client_id') === 'AUEU_SURVEY', [searchParams])

  return (
    <div
      css={css`
        ${isVideo ? `
          position: fixed;
          background: transparent;
          top: 0;
          left: 0;
          right: 0;
        ` : ``
      }
    `} className="flex w-full items-center space-x-3 z-20 lg:py-3 pr-1 pl-1">

      <CloseIcon fill="#fff" onClick={props?.onClick}/>
      <div className="flex-1 relative">
        <div
          className={`${styles.wrapper} ${classNames?.progressContainer || ''}`}
          // style={{gridTemplateColumns: `repeat(${stories.length},1fr)`}}
        >
          {/*{stories.map((story: IStoryIndexedObject) => (*/}
          {/*  <ProgressBar*/}
          {/*    key={story.index}*/}
          {/*    hasStoryPassed={story.index <= props.activeStoryIndex}*/}
          {/*    isActive={story.index === props.activeStoryIndex}*/}
          {/*    story={story}*/}
          {/*    isPaused={story.index === props.activeStoryIndex && props.isPaused}*/}
          {/*  />*/}
          {/*))}*/}
          <div
            className="h-4 z-10 w-full bg-neutral-200"
          />
          <div
            css={css`
                width: ${(props.activeStoryIndex * 100) / (stories.length)}%;
            `}
            className={`
              h-4 z-10 transition-all ease-in-out absolute left-0 top-0
              ${isAueuCourse || isAueuSurvey ? 'bg-[var(--colorPrimary)]' : 'bg-[var(--colorPositive)]'}
            `}
          />
        </div>
      </div>
      {props?.actions}
    </div>
  );
}
