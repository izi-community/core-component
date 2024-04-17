import * as React from 'react';
type GenericTagName = keyof Pick<JSX.IntrinsicElements, 'div' | 'span' | 'li' | 'blockquote'>;
type HeadingTagName = keyof Pick<JSX.IntrinsicElements, 'h1' | 'h2' | 'h3' | 'h4' | 'h5'> | GenericTagName;
type ParagraphTagName = keyof Pick<JSX.IntrinsicElements, 'p'> | GenericTagName;
type BigParagraphTagName = HeadingTagName | ParagraphTagName;
export declare const InheritColor: unique symbol;
export type TypographyTone = 'primary' | 'secondary' | 'tertiary' | 'critical' | typeof InheritColor;
export type TypographyVariant = TypographyWeight | 'title';
export type TypographyWeight = 'regular' | 'bold';
export type TypographyAlignment = 'center' | 'end' | 'inherit' | 'start';
export declare const typographySizes: readonly ["xxlarge", "xlarge", "large", "medium", "small", "xsmall", "xxsmall"];
export type TypographySize = (typeof typographySizes)[number];
type TypographyProps<T> = {
    id?: string
    tagName?: T
    alignment?: TypographyAlignment
    tone?: TypographyTone
    margins?: 'none' | 'legacy'
    lineClamp?: number
    allowUserSelect?: boolean
    capitalization?: 'default' | 'uppercase'
    className?: string
    children?: React.ReactNode
    variant?: TypographyVariant
    size?: TypographySize
    elementTiming?: string
};
export declare function getDefaultTagName(
 { variant, size, }: {
     variant: TypographyVariant;
     size: TypographySize;
 }
): "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type TextTypographySize = Exclude<TypographySize, 'xxsmall'>;
export type TitleTypographySize = TypographySize;
export type TextProps = Omit<TypographyProps<BigParagraphTagName>, 'variant' | 'size'> & {
    weight?: TypographyWeight
    size?: TextTypographySize;
};
export type TitleProps = Omit<TypographyProps<HeadingTagName>, 'variant'>;
export declare const Text: React.MemoExoticComponent<({ weight, ...props }: TextProps) => React.DetailedReactHTMLElement<{
    id: string | undefined;
    className: string;
    style: {
        WebkitLineClamp: number;
    } | {
        WebkitLineClamp?: undefined;
    };
    elementtiming: string | undefined;
}, HTMLElement> | null>;
export declare const Title: React.MemoExoticComponent<(props: TitleProps) => React.DetailedReactHTMLElement<{
    id: string | undefined;
    className: string;
    style: {
        WebkitLineClamp: number;
    } | {
        WebkitLineClamp?: undefined;
    };
    elementtiming: string | undefined;
}, HTMLElement> | null>;
export {};
