import React, {ReactNode, SyntheticEvent, MouseEvent, TouchEvent, useMemo, Fragment} from "react";
import classNames from "classnames";
import {LoadingOutlined} from "@ant-design/icons";
import SVGCircleTick from '../../../resources/icons/svg/ic_circle_tick.svg'
import {Interpolation} from "@emotion/serialize";
import {css, Theme} from "@emotion/react";
import SVGXIcon from "../../../resources/icons/svg/ic_x.svg";

export type TouchOrMouseEvent<T> =
  SyntheticEvent
  & Partial<Omit<MouseEvent<T>, 'nativeEvent'>>
  & Partial<Omit<TouchEvent<T>, 'nativeEvent'>>;
type ButtonProps = {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | undefined | 'loading' | 'positive' | 'info' | 'warn' | 'critical';
  type?: 'button' | 'submit' | 'reset' | undefined;
  disabled?: boolean;
  loading?: boolean;
  stretch?: boolean;
  onClick?: ((event: TouchOrMouseEvent<any>) => void);
  icon?: ReactNode;
  csss?: Interpolation<Theme>
}
const Button = ({
                  children,
                  icon,
                  variant = 'primary',
                  type = 'button',
                  disabled = false,
                  loading = false,
                  stretch,
                  onClick,
                  csss,
                }: ButtonProps) => {

  const stretchStyle = useMemo(() => {
    if (stretch) return 'flex w-full'

    return ''
  }, [stretch])

  const loadingVariant = useMemo(() => {
    if (variant === 'primary') {
      return `bg-[var(--colorPrimary)] text-[var(--colorPrimaryFore)]`
    }

    if (variant === 'secondary') {
      return `bg-[var(--colorSecondary)] text-[var(--colorSecondaryFore)]`
    }

    if (variant === 'tertiary') {
      return `bg-[var(--colorTertiary)] text-[var(--colorTertiaryFore)]`
    }

    if (variant === 'positive') {
      return `bg-[var(--colorPositive)] text-[var(--colorWhite)]`
    }

    if (variant === 'info') {
      return `bg-[var(--colorInfo)] text-[var(--colorWhite)]`
    }

    if (variant === 'warn') {
      return `bg-[var(--colorWarn)] text-[var(--colorWhite)]`
    }

    return ''
  }, [variant])

  const disabledVariant = useMemo(() => {
    if (variant === 'primary') {
      return `bg-[var(--colorSecondaryActive)] text-[var(--colorWhite)]`
    }

    if (variant === 'secondary') {
      return `bg-[var(--colorSecondaryForeDisabled)] text-[var(--colorSecondaryForeDisabled)]`
    }

    if (variant === 'tertiary') {
      return `bg-[var(--colorTertiaryForeDisabled)] text-[var(--colorTertiaryForeDisabled)]`
    }

    if (variant === 'positive') {
      return `bg-[var(--colorPositive)] text-[var(--colorWhite)]`
    }

    if (variant === 'info') {
      return `bg-[var(--colorInfoDisabled)] text-[var(--colorWhite)]`
    }

    if (variant === 'warn') {
      return `bg-[var(--colorWarnDisabled)] text-[var(--colorWhite)]`
    }

    if (variant === 'critical') {
      return `bg-[var(--colorCriticalDisabled)] text-[var(--colorWhite)]`
    }
    return ''
  }, [variant])

  const normalVariant = useMemo(() => {

    if (['primary', 'loading'].includes(variant)) {
      return `bg-[var(--colorPrimary)] text-[var(--colorPrimaryFore)] transition-all lg:hover:bg-[var(--colorPrimaryHover)] active:bg-[var(--colorPrimaryActive)]`
    }

    if (variant === 'secondary') {
      return `bg-[var(--colorSecondary)] text-[var(--colorSecondaryFore)] transition-all lg:hover:bg-[var(--colorSecondaryHover)] active:bg-[var(--colorSecondaryActive)]`
    }

    if (variant === 'tertiary') {
      return `bg-[var(--colorTertiary)] text-[var(--colorTertiaryFore)] transition-all lg:hover:bg-[var(--colorTertiaryHover)] active:bg-[var(--colorTertiaryActive)]`
    }


    if (variant === 'positive') {
      return `bg-[var(--colorPositive)] text-[var(--colorWhite)]`
    }

    if (variant === 'info') {
      return `bg-[var(--colorInfo)] text-[var(--colorWhite)]`
    }

    if (variant === 'warn') {
      return `bg-[var(--colorWarn)] text-[var(--colorWhite)]`
    }

    if (variant === 'critical') {
      return `bg-[var(--colorCritical)] text-[var(--colorWhite)]`
    }

    return ''
  }, [variant])

  const variantStyle = useMemo(() => {

    if (disabled && !loading) {
      return disabledVariant
    }

    if (loading) {
      return loadingVariant
    }

    return normalVariant
  }, [variant, disabled])

  return (
    <button
      css={css`
          ${csss as any};

          svg path {
              stroke: ${disabled ? 'var(--colorWhite)' : ''};
          }
      `}
      type={type}
      onClick={(e) => !loading && !disabled && onClick?.(e)}
      disabled={disabled}
      className={classNames(stretchStyle,
        variantStyle,
        `${variant === 'loading' || (icon && !children) ? 'w-[44px] h-[44px] !rounded-[44px] flex justify-center items-center' : 'px-4 py-[11px]'} active:scale-95 transition-all duration-200 ease-in-out rounded-[var(--space20)] justify-center items-center space-x-2`)}>
      {icon || <Fragment/>}
      {
        !loading && children && (
          <span className="inline-flex overflow-hidden text-ellipsis text-nowrap max-w-full body-medium !font-medium">
            {children}
          </span>
        )
      }

      {
        loading && <LoadingOutlined rev={undefined} spin/>
      }
    </button>
  )
}

export const ConfirmButton = ({csss, isSubmitted = false, ...props}: {csss?: Interpolation<Theme>, isSubmitted?: boolean} & ButtonProps) => {

  return (
    <Button
      stretch
      csss={css`
          align-items: center;
          justify-content: center;
          display: flex;
      `}
      variant={isSubmitted ? 'positive' : 'primary'}
      // @ts-ignore
      {...props}
    >
      Submit
    </Button>
  )
}

export const CloseButton = ({csss, ...props}: {csss?: Interpolation<Theme>} & ButtonProps) => {

  return (
    <Button
      {...props}
      csss={css`
        svg {
            width: 32px;
            height: 32px;
            path {
                stroke: var(--colorTypographySecondary);
                stroke-width: 2px;
            }
        }
      `}
      variant="secondary" icon={<SVGXIcon/>}>

    </Button>
  )
}

export default Button
