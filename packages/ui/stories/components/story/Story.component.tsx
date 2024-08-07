import {useEffect, useMemo, useRef, useState} from 'react';
import * as CONSTANTS from './Story.constants';
import styles from './Story.styles.module.css';
import { IStoryComponentProps } from '../../types';
import { Image } from '../image';
import { Video } from '../video';
import { CustomComponent } from '../customComponent';
import { SeeMore } from '../seeMore';
import { SeeMoreComponent } from '../SeeMoreComponent';
import * as hooks from '../../hooks';

export function Story(props: IStoryComponentProps) {
  const [showSeeMoreComponent, setShowSeeMoreComponent] = useState(false);
  const { classNames, orientation, direction } = hooks.useStoriesContext();

  useEffect(() => {
    setShowSeeMoreComponent(false);
  }, [props.story]);

  function getStory() {
    if (props.story.type === CONSTANTS.STORY_TYPES.IMAGE) {
      return <Image {...props} />;
    }
    if (props.story.type === CONSTANTS.STORY_TYPES.VIDEO) {
      return <Video orientation={orientation} screenPaddingClass={props.screenPaddingClass} {...props} />;
    }
    if (props.story.type === CONSTANTS.STORY_TYPES.COMPONENT) {
      return <CustomComponent orientation={orientation} screenPaddingClass={props.screenPaddingClass} {...props} />;
    }

    return null;
  }

  function getHeader() {
    if (typeof props.story.header === 'function') {
      return <props.story.header />;
    }
    return props.story.header;
  }

  function handleSeeMore() {
    props.onPause();
    setShowSeeMoreComponent(true);
    props.story.onSeeMoreClick?.(props.story.index);
  }

  function handleCloseSeeMore() {
    props.onResume();
    setShowSeeMoreComponent(false);
  }

  return (
    <div
      className={`${styles.wrapper} ${classNames?.storyContainer || ''} bg-white rounded-xl animate__animated animate__fadeIn animate__fast`}>
      {/*<div className={styles.closeIcon}>*/}
      {/*  <closeIcon/>*/}
      {/*</div>*/}
      {getStory()}
      {props.story.header && <div className={styles.header}>{getHeader()}</div>}
      <SeeMore onSeeMoreClick={handleSeeMore} story={props.story}/>
      {showSeeMoreComponent && (
        <SeeMoreComponent story={props.story} onClose={handleCloseSeeMore}/>
      )}
    </div>
  );
}
