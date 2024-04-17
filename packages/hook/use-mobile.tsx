import {useWindowSize} from "usehooks-ts";
import {useEffect, useState} from "react";
import {isMobile} from 'react-device-detect';
import SDK from '../../request/auth'

export const useMobile = () => {
  const {width} = useWindowSize()
  const [mode, changeMode] = useState<'mobile' | 'desktop' | undefined>()

  useEffect(() => {
    initLayoutMode()
  }, [isMobile, width]);

  const initLayoutMode = async () => {
    const body = document.body
    //ts-ignore
    const mode = await SDK.requestRenderMode().then((a: any) => a).catch((): any => undefined)
    if (body) {
      const _mode = mode === 'mobile' || isMobile ? 'mobile' : 'desktop'
      body.setAttribute('story-mode', _mode)
      changeMode(_mode)
    }
  }

  return {
    mode
  }
}

export default useMobile
