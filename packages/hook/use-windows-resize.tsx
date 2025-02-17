import { useState, useEffect, useMemo } from 'react';
import { useWindowSize } from "usehooks-ts";
import useMobile from "./use-mobile";
import { useSearchParams } from "react-router-dom";

function useWindowsResize() {
  const { mode } = useMobile();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [searchParams] = useSearchParams();
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Calculate deviceHeight once and memoize it
  const deviceHeight = useMemo(() => {
    const paramHeight = parseInt(searchParams?.get('height') ?? '0');
    return paramHeight && windowHeight < paramHeight ? paramHeight : windowHeight;
  }, [searchParams, windowHeight]);

  // Memoize orientation calculation
  const orientation = useMemo(() => {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }, [windowWidth, windowHeight]);

  // Calculate size based on deviceHeight
  useEffect(() => {
    const heightRatio = orientation === 'portrait' ? 0.75 : 0.9;
    const widthRatio = orientation === 'portrait' ? 0.55 : 0.54;

    const height = mode === 'mobile' ? deviceHeight : deviceHeight * heightRatio;
    const width = mode === 'mobile' ? windowWidth : height * widthRatio;

    setSize({ width, height });
  }, [windowWidth, deviceHeight, mode, orientation]);

  return size;
}

export default useWindowsResize;