import { createContext } from 'react';
import { IStoryContext } from '../types';

const defaultStoryContext: IStoryContext = {
  stories: [],
  width: '100%',
  height: '100%',
  defaultDuration: 10000,
  isPaused: false,
  direction: '',
  currentIndex: 0,
  setIsClickPaused: () => {},
  isClickPaused: false,
};

export const StoriesContext = createContext(defaultStoryContext);
