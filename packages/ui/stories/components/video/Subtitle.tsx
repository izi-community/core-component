import React, { useEffect, useState, useRef } from 'react'

import subtitleParser from './subtitle-parser'
import ConvoBg from '../../../../../resources/icons/svg/ic_convo.svg'
import { css } from '@emotion/react'


/**
 * * subtitles interface
 * * @param { selectedsubtitle: { file } } url of the subtitle
 * * @param { currentTime } time in miliseconds from the video playback
 * * @param { containerStyle: {} } style for the container of the subtitles component
 * * @param { textStyle: {} } style for the text of the subtitle component
 */
export interface SubtitlesProps {
  selectedsubtitle: {
    file: string
  }
  currentTime: number
  containerStyle?: any
  textStyle?: any
}

/**
 * * subtitle interface
 * * @param {start} starting time in relation to the video in miliseconds
 * * @param {end} ending time in relation to the video in miliseconds
 * * @param {part} text of the subtitle
 */
export interface Subtitle {
  start: number
  end: number
  part: string
}

const Subtitles = ({
                                               selectedsubtitle,
                                               currentTime,
                                               containerStyle = {},
                                               textStyle = {},
                                             }: SubtitlesProps) => {
  /**
   * * First phase parses the subtitle url to an array of objects with the subtitle interface schema
   * * method for parsing varies depending on the file extension (vtt or srt)
   */
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [textHeight, setTextHeight] = useState(120);
  const [textWidth, setTextWidth] = useState(192);

  const textRef = useRef(null);

  const parseSubtitles = async (): Promise<void> => {

    const parsedSubtitles = await subtitleParser(selectedsubtitle.file)

    console.log({parsedSubtitles})
    setSubtitles(parsedSubtitles)
  }

  useEffect(() => {
    parseSubtitles()
  }, [])

  /**
   * * Second phase filters the subtitles array to get the subtitles that are currently visible
   */
  const [text, setText] = useState('')

  useEffect(() => {
    if (subtitles) {
      let start = 0
      let end: number = subtitles.length - 1

      while (start <= end) {
        const mid: number = Math.floor((start + end) / 2)

        const subtitle: Subtitle = subtitles[mid] || {
          start: 0,
          end: 0,
          part: '',
        }

        if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
          setText(subtitle.part.trim())
          return
        } else if (currentTime < subtitle.start) {
          end = mid - 1
        } else {
          start = mid + 1
        }
      }

      return setText('')
    }
  }, [currentTime, subtitles])

  useEffect(() => {
    if (textRef.current) {
      if (textRef.current.offsetHeight > 120) {
        setTextHeight(textRef.current.offsetHeight);
      }

      if (textRef.current.offsetWidth > 192) {
        setTextWidth(textRef.current.offsetWidth);
      }
      
    }
  }, [text]);

  return (
    <div style={{
        position: 'absolute',
        top: '10%',
        zIndex: 20,
        left: 0,
        right: 0,
      }}
      css={css`
        .wrap-container {
          position: relative;
          height: ${textHeight  + 105}px;
          width: 60%;
        }

        .container-svg {
          position: absolute;
          top: 0;
          opacity: ${text ? 0.6 : 0};
          transition: all .3s ease-in-out;
        }

        svg {
          height: ${textHeight + 105}px;
          width: ${textWidth + 22}px;
        }

        .text {
            position: absolute;
            top: 0;
            z-index: 10;
            margin: 35px 0px 0px 20px;
            fontSize: 18;
            opacity: 0.6;
            textAlign: left;
            alignSelf: center;
            color: rgba(0,0,0,8);
            textShadowColor: #000;
            textShadowOffset: { width: 2, height: 2 };
            textShadowRadius: 2;
            transition: all 0.3 easy;
            transform: rotate(-5deg);
            ${textStyle}
        }
      `}
    >
      {text ? (
        <>
          <div className='wrap-container'>
            <div
              ref={textRef}
              className="text"
            >
              {text}
            </div>
            <div className='container-svg'>
              <ConvoBg/>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default Subtitles
