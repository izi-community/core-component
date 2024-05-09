import {ReactNode} from "react";

interface IStoryObject {
  type: string;
  url: string;
  duration: number;
  component?: any;
  header?: any;
  seeMore?: any;
  seeMoreComponent?: any;
  onSeeMoreClick?: (storyIndex: number) => void;
  payload?: { [k: string]: any } | undefined;
}

interface IStoryIndexedObject extends IStoryObject {
  index: number;
  calculatedDuration: number;
}

interface IStoryClassNames {
  main?: string;
  progressContainer?: string;
  progressBarContainer?: string;
  progressBar?: string;
  storyContainer?: string;
}

export interface IStoryProps {
  stories: IStoryObject[];
  height?: '100%';
  width?: '100%';
  onStoryChange: (currentIndex: number) => void;
  currentIndex?: number;
  defaultDuration?: number;
  onStoriesStart?: () => void;
  onAllStoriesEnd?: () => void;
  classNames?: IStoryClassNames;
  pauseStoryWhenInActiveWindow?: boolean;
  autoPlay?: boolean;
  disabledNext?: boolean;
  effectSounds?: {
    select?: () => void;
    error?: () => void;
  },
  children?: ReactNode;
  onCloseCallback?: () => void;
  onInit: (args: any) => void;
}

export interface IStoryContext {
  stories: IStoryIndexedObject[];
  height?: '100%';
  width?: '100%';
  defaultDuration: number;
  isPaused: boolean;
  classNames?: IStoryClassNames;
  direction?: string;
  changeDirection?: (a: string) => void;
}

export interface IStoryComponentProps {
  story: IStoryIndexedObject;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
  disabledNext?: string;
  children: ReactNode;
  effectSounds?: {
    select?: () => void;
    error?: () => void;
  },
}
