import { useEffect } from 'react';
import { IStoryComponentProps } from '../../types';
import styles from './Image.styles.module.css';
import {css} from '@emotion/react';

export function Image(props: IStoryComponentProps) {
  useEffect(() => {
    props.onPause();
  }, []);

  function handleLoadImage() {
    //set timeout is done because there is an inconsitancy in safari and other browser
    //on when to call useEffect
    setTimeout(() => {
      props.onResume();
    }, 4);
  }

  return (
    <>
      <img
        className={styles.image}
        src={props.story.url}
        alt="story"
        css={css`
            max-height: initial!important;
            height: auto!important;

            @media screen and (max-width: 768px) {
                max-height: initial!important;
                height: auto!important;
            }
        `}
        onLoad={handleLoadImage}
      />
      {
        props?.children
      }
    </>
  );
}
