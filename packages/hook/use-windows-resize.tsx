import { useState, useEffect } from 'react';
import {useWindowSize} from "usehooks-ts";
import useMobile from "./use-mobile";

// Custom hook to listen to window resize events and calculate dimensions
function useWindowsResize() {
  const {mode} = useMobile()
  const {width: windowWidth,height: windowHeight} = useWindowSize()
  const [size, setSize] = useState({ width: 0, height: 0 });

  const getOrientation = () => {
    if(window.innerHeight > window.innerWidth){
      return "portrait";
    } else {
      return "landscape";
    }
  }

  useEffect(() => {
    let height = mode === 'mobile' ? windowHeight : windowHeight * (getOrientation() === 'portrait' ? 0.75 : 0.9);

    let width = mode === 'mobile' ? windowWidth : height * (getOrientation() === 'portrait' ? 0.55 : 0.57);

    setSize({ width, height });
  }, [windowWidth, windowHeight, mode]);

  return size;
}


export default useWindowsResize
