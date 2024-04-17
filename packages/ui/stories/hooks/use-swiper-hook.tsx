import {useEffect, useRef} from "react";
import {SwiperProps} from "swiper/react";

const useSwiperHook = () => {
  const swiperRef = useRef<SwiperProps | undefined>()

  useEffect(() => {
    swiperRef.current = (window as any).SWIPPER
  }, []);

  const handleSliderInteractionStart = () => {
    if ((window as any).SWIPPER && !(window as any).SWIPPER?.destroyed) {
      (window as any).SWIPPER.disable?.();
    }
  };

  const handleSliderInteractionEnd = () => {
    if ((window as any).SWIPPER && !(window as any).SWIPPER?.destroyed) {
      (window as any).SWIPPER.enable?.();
    }
  };

  return {
    swiperRef,
    handleSliderInteractionStart,
    handleSliderInteractionEnd
  }
}

export default useSwiperHook
