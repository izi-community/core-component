import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import * as CONSTANTS from './Actions.constants';
import styles from './Actions.styles.module.css';
import { Portal } from 'react-portal';
import { EventListener } from '../../../event-listener';
import { debounce } from 'lodash';
import useMobile from '../../../../hook/use-mobile';
import { StoriesContext } from '../../contexts';

interface IActionsProps {
  onNextClick: () => void;
  onPrevClick: () => void;
  onPause: () => void;
  onResume: () => void;
}

type IActionEvent = React.MouseEvent | React.TouchEvent;

export function Actions({ onNextClick, onPrevClick, onPause, onResume }: IActionsProps) {
  const { changeDirection, direction } = useContext(StoriesContext);
  const { mode } = useMobile();
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // New state for visibility
  const pauseTimerRef = useRef<any>(null);
  const isHoldingRef = useRef(false);
  const startTouchRef = useRef({ x: 0, y: 0 });
  const endTouchRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (event: React.TouchEvent) => {
    console.log("handleTouchStart")
    startTouchRef.current = {
      x: event.touches[0].pageX,
      y: event.touches[0].pageY,
    };
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    console.log("handleTouchMove___")
    endTouchRef.current = {
      x: event.touches[0].pageX,
      y: event.touches[0].pageY,
    };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    console.log("_______handleTouchEnd")
    const diffX = endTouchRef.current.x - startTouchRef.current.x;
    const diffY = endTouchRef.current.y - startTouchRef.current.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 0) {
        // Swipe right
        changeDirection('right');
        onPrevClick();
      } else {
        // Swipe left
        changeDirection('left');
        onNextClick();
      }
    } else {
      // Vertical swipe
      if (diffY > 0) {
        // Swipe down
        changeDirection('down');
        // Handle swipe down action
      } else {
        // Swipe up
        changeDirection('up');
        // Handle swipe up action
      }
    }

    // Reset touch coordinates
    startTouchRef.current = { x: 0, y: 0 };
    endTouchRef.current = { x: 0, y: 0 };
  };

  const handleMouseDown = (event: IActionEvent) => {
    event.stopPropagation();
    event.preventDefault();

    // Indicate that mouse down has started but not yet determined as holding
    isHoldingRef.current = false;

    // Clear any existing timer to ensure we start fresh
    clearTimeout(pauseTimerRef.current);

    pauseTimerRef.current = setTimeout(() => {
      // Once timeout completes, mark it as holding
      isHoldingRef.current = true;
      onPause();
    }, 200); // Duration to qualify as holding
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    console.log("handleMouseUp___")
    clearTimeout(pauseTimerRef.current);
    if (isHoldingRef.current) {
      onResume();
      setIsStoryPaused(false);
      isHoldingRef.current = false;
      return;
    }

    // Handle click action
    const region = event.currentTarget.getAttribute('data-region');

    if (region === CONSTANTS.EVENT_REGION.LEFT) {
      onPrevClick();
    } else if (region === CONSTANTS.EVENT_REGION.RIGHT) {
      onNextClick();
    }
  };

  // New handler for touch move and wheel events
  const handleVisibilityChange = () => {
    setIsVisible(false);
    // Consider debouncing this logic if needed
    clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 400); // Restore after a delay
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => handleVisibilityChange();
    // const handleTouchMove = (e: TouchEvent) => handleVisibilityChange();

    window.addEventListener('wheel', handleWheel);
    // window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      // window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const onkeydown = debounce((e) => {
    if (e?.key === 'ArrowRight') {
      onNextClick();
    }

    if (e?.key === 'ArrowLeft') {
      onPrevClick();
    }
  }, 100);

  return (
    <Fragment>
      {(isVisible && mode === 'mobile') && (
        <Fragment>
          <div
            className={`${styles.left} !w-[50%] block`}
            data-region={CONSTANTS.EVENT_REGION.LEFT}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <div
            className={`${styles.right} !w-[50%] block`}
            data-region={CONSTANTS.EVENT_REGION.RIGHT}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </Fragment>
      )}
      {(isVisible && mode === 'desktop') && (
        <Fragment>
          {
            document.getElementById('stories-left-action') && (
              <Portal node={document && document.getElementById('stories-left-action')}>
                <div
                  className={`${styles.left}`}
                  data-region={CONSTANTS.EVENT_REGION.LEFT}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                />
              </Portal>
            )
          }
          {
            document.getElementById('stories-right-action') && (
              <Portal node={document && document.getElementById('stories-right-action')}>
                <div
                  className={`${styles.right}`}
                  data-region={CONSTANTS.EVENT_REGION.RIGHT}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                />
              </Portal>
            )
          }
        </Fragment>
      )}

      <EventListener event="keydown" handler={onkeydown} />
    </Fragment>
  );
}
