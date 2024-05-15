import React, { useEffect, useState } from 'react'

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


  return (
    <div style={{
      position: 'absolute',
      top: '10%',
      zIndex: 20,
      left: 0,
      right: 0,
    }}
    css={css`
        svg {
            position: absolute;
            left: 6px;
            right: 0;
            width: 60%;
            height: 300px;
            top: -60px;
            z-index: -1;
            opacity: ${text ? 0.6 : 0};
            transition: all .3s ease-in-out;
        }
        .text {
            transform: rotate(-5deg);
        }
    `}
    >
      {text ? (
        <div
          className="text"
          style={{
            width: '60%',
            fontSize: 18,
            opacity: 0.6,
            textAlign: 'left',
            alignSelf: 'center',
            padding: 25,
            color: 'rgba(0,0,0,8)',
            textShadowColor: '#000',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 2,
            transition: 'all 0.3 easy',
            ...textStyle,
          }}
        >
          {text}
        </div>
      ) : null}
      <ConvoBg/>
    </div>
  )
}

export default Subtitles
