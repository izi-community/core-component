import { css } from '@emotion/react';
import SVGMenu from "../../../../../resources/icons/svg/ic_menu_outline.svg";
import Button from "../../../button";
interface IProps {

}

export const CloseIcon = (props: any) => {
  return (
    <Button
      onClick={props?.onClick}
      csss={css`background: transparent !important;`}
      //@ts-ignore
      icon={<SVGMenu css={css`path {
            fill: var(--colorTypographyPlaceholder);
        }`} width={28} height={28}/>}/>
  );
}
