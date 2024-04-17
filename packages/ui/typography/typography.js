import classNames from 'classnames';
import * as React from 'react';
import styles, { getStyle } from './typography_internal.css.js';
import {UnreachableError} from "../base/preconditions";
export const InheritColor = Symbol('inherit');

export const typographySizes = [
    'xxlarge',
    'xlarge',
    'large',
    'medium',
    'small',
    'xsmall',
    'xxsmall',
];
function getVariantClassNamePart(variant) {
    switch (variant) {
        case 'regular':
            return '';
        case 'title':
            return 'Title';
        case 'bold':
            return 'Bold';
        default:
            throw new UnreachableError(variant);
    }
}
function getSizeClassNamePart(size) {
    switch (size) {
        case 'xxlarge':
            return 'ExtraExtraLarge';
        case 'xlarge':
            return 'ExtraLarge';
        case 'large':
            return 'Large';
        case 'medium':
            return 'Medium';
        case 'small':
            return 'Small';
        case 'xsmall':
            return 'ExtraSmall';
        case 'xxsmall':
            return 'ExtraExtraSmall';
        default:
            throw new UnreachableError(size);
    }
}
function getTextClassName({ variant, size }) {
    return getStyle(`text${getVariantClassNamePart(variant)}${getSizeClassNamePart(size)}`);
}
export function getDefaultTagName({ variant, size, }) {
    if (variant !== 'title') {
        return 'p';
    }
    switch (size) {
        case 'xxlarge':
            return 'h1';
        case 'xlarge':
            return 'h1';
        case 'large':
            return 'h2';
        case 'medium':
            return 'h3';
        case 'small':
            return 'h4';
        case 'xsmall':
            return 'h5';
        case 'xxsmall':
            return 'h6';
        default:
            throw new UnreachableError(size);
    }
}
function TextComponent(props) {
    const { id, alignment = 'start', tone = 'primary', margins = 'none', capitalization = 'default', variant = 'regular', size = 'medium', tagName = getDefaultTagName({ variant, size }), lineClamp, children, allowUserSelect, className, elementTiming, } = props;
    if (children === '' || children == null) {
        return null;
    }
    const lineClampClassName = lineClamp && (lineClamp === 1 ? styles.ellipsis : styles.lineClamp);
    const lineClampStyles = lineClamp && lineClamp > 1 ? { WebkitLineClamp: lineClamp } : {};
    const finalClassName = classNames(getTextClassName({ variant, size }), margins === 'legacy' && styles.margin, getStyle(alignment), tone === InheritColor ? styles.inheritColor : tone && getStyle(tone), lineClampClassName, allowUserSelect && styles.allowUserSelect, capitalization === 'uppercase' && styles.uppercase, className);
    return React.createElement(tagName, {
        id,
        className: finalClassName,
        style: lineClampStyles,
        elementtiming: elementTiming,
    }, children);
}
export const Text = React.memo(({ weight, ...props }) => {
    return TextComponent({ variant: weight, ...props });
});
Text.displayName = 'Text';
export const Title = React.memo((props) => {
    return TextComponent({ ...props, variant: 'title' });
});
Title.displayName = 'Title';
