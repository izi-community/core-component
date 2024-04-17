import styles from './CustomComponents.styles.module.css';
import { IStoryComponentProps } from '../../types';
import { useEffect, useRef, useState } from 'react';
import useWindowsResize from "../../../../hook/use-windows-resize";
import {css} from "@emotion/react";

export function CustomComponent(props: IStoryComponentProps) {
  const {width, height} = useWindowsResize()
  const [isRunningAnimation, runAnimation] = useState<string>('');
  const refTimeout = useRef<any>();
  const animationResetTimeout = useRef<any>();

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
    <div className={`${styles.component} no-scrollbar`}>
      <props.story.component
        pause={props.onPause}
        resume={props.onResume}
        story={props.story}
        isPaused={props.isPaused}
        className={`animate__animated ${isRunningAnimation}`}
      />
      {props.children}
    </div>
  );
}
