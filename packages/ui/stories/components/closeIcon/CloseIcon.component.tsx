import { css } from '@emotion/react';
import SVGMenu from "../../../../../resources/icons/svg/ic_menu_outline.svg";
import Button from "../../../button";
interface IProps {

}

export const CloseIcon = (props: any) => {
  return (
    <Button
      onClick={props?.onClick}
      csss={css`
          width: 40px !important;
          height: 40px;
          padding: 0 !important;
          opacity: 0.9;
          background: rgba(255, 255, 255,1);
          @media screen and (max-width: 375px) {
              width: 40px;
              height: 40px;
          }
      `}
      //@ts-ignore
      icon={<SVGMenu css={css`path {
            fill: var(--colorTypographyPlaceholder);
        }`} width={24} height={24}/>}/>
  );
}
