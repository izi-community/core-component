import styles from './CustomComponents.styles.module.css';
import { IStoryComponentProps } from '../../types';
import React, { useEffect, useRef, useState } from 'react';
import useWindowsResize from "../../../../hook/use-windows-resize";
import {css} from "@emotion/react";
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts'

function useElementSize(className: string) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = document.querySelector(`.${className}`);

    if (!element) {
      console.warn(`Element with className ${className} not found`);
      return;
    }

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(element);

    // Clean up
    return () => observer.unobserve(element);
  }, [className]); // Re-run effect if className changes

  return size;
}

export function CustomComponent(props: IStoryComponentProps) {
  const {width, height} = useWindowsResize()
  const [isRunningAnimation, runAnimation] = useState<string>('');
  const refTimeout = useRef<any>();
  const animationResetTimeout = useRef<any>();
  const { height: elementHeight } = useElementSize('custom-component');
  const ref = useRef<HTMLDivElement>(null)
  const {  height: elementHeight2 = 0 } = useResizeObserver({
    ref,
    box: 'border-box',
  })


  useEffect(() => {
    if (props.disabledNext) {
      clearTimeout(refTimeout.current);
      clearTimeout(animationResetTimeout.current); // Clear any existing animation reset timeout

      // Temporarily remove the animation class to reset the animation
      runAnimation('');
      animationResetTimeout.current = setTimeout(() => {
        // Re-add the animation class after a short delay
        runAnimation('animate__headShake');
      }, 10); // A short delay is enough to reset the animation

      props?.effectSounds?.error?.();
      refTimeout.current = setTimeout(() => {
        runAnimation('');
      }, 2000);
    } else {
      clearTimeout(refTimeout.current);
    }

    return () => {
      runAnimation('');
    };
  }, [props.disabledNext]);

  return (
    <div className={`${styles.component} no-scrollbar`} ref={ref}>
      <props.story.component
        pause={props.onPause}
        resume={props.onResume}
        story={props.story}
        isPaused={props.isPaused}
        className={`animate__animated ${isRunningAnimation}`}
        screenPaddingClass={props?.screenPaddingClass}
        orientation={props?.orientation}
      />
      {React.Children.map((props.children), (child, idx) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        return React.cloneElement(child, {
          height: Math.max(elementHeight, elementHeight2),
          orientation: props?.orientation,
          screenPaddingClass: (Array.isArray(props.children) && (props.children ?? []).length - 1 === idx) ? props?.screenPaddingClass : ''
        } as any);
      })}
    </div>
  );
}
