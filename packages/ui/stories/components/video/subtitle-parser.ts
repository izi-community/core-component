import axios from 'axios'
import SrtParser from 'srt-parser-2';
import parser from 'subtitles-parser-vtt'

import { Subtitle } from './Subtitle'
import timeToSeconds from './time-to-seconds'

const subtitleParser = async (selectedsubtitle = ''): Promise<Subtitle[]> => {
  const subitleUrl: string = selectedsubtitle
  const { data: subtitleData } = await axios.get(subitleUrl)

  // const subtitleType = `${subitleUrl}`.split('.')[subitleUrl.split('.').length - 1]
  const subtitleType: any = `vtt`

  const result: Subtitle[] = []

  if (subtitleType === 'srt') {
    interface srtParserSubtitle {
      startTime: string
      endTime: string
      text: string
    }

    const parser: {
      fromSrt: (data: any) => srtParserSubtitle[]
    } = new SrtParser()

    const parsedSubtitle: srtParserSubtitle[] = parser.fromSrt(subtitleData)

    parsedSubtitle.forEach(({ startTime, endTime, text }) => {
      result.push({
        start: timeToSeconds(startTime.split(',')[0]),
        end: timeToSeconds(endTime.split(',')[0]),
        part: text,
      })
    })
  }

  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = parseInt(secondsParts[1], 10);

    return (
      (hours * 3600 * 1000) + // hours to milliseconds
      (minutes * 60 * 1000) + // minutes to milliseconds
      (seconds * 1000) +      // seconds to milliseconds
      milliseconds            // milliseconds
    );
  };
  if (subtitleType === 'vtt') {

    let parsedSubtitle: any = parser.fromVtt(subtitleData);

    parsedSubtitle.forEach(({ startTime, endTime, text }: any) => {
      result.push( {
        start: parseTimestamp(startTime)/1000,
        end: parseTimestamp(endTime)/1000,
        part: text,
      })
    })
  }

  return result
}

export default subtitleParser
