import SVGUnMuted from '../../../../../resources/icons/svg/ic_unmuted.svg'
import SVGMuted from '../../../../../resources/icons/svg/ic_muted.svg'
interface IProps {
  type: string;
}

export function SoundIcon(props: IProps) {
  if (props.type === 'off') {
    return (
      // @ts-ignore
      <SVGMuted width={32} height={32}/>
    );
  }

  return (
    // @ts-ignore
    <SVGUnMuted width={32} height={32}/>
  );
}
