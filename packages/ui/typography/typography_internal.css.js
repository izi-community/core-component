const styles = {
    allowUserSelect: 'user-select-auto',
    uppercase: "uppercase",
    textTitleLarge: "title-large",
    textTitleMedium: "title-medium",
    textTitleSmall: "title-small",
    textTitleExtraSmall: "title-xsmall",
    textLarge: "body-large",
    textMedium: "body-medium",
    textSmall: "body-small",
    textExtraSmall: "body-xsmall",
    textBoldLarge: "body-large bold",
    textBoldMedium: "body-medium bold",
    textBoldSmall: "body-small bold",
    margin: "mb-2",
    inherit: "text-inherit",
    start: "text-start",
    center: "text-center",
    end: "text-right",
    primary: "text-[var(--colorTypographyPrimary)]",
    secondary: "text-[var(--colorTypographySecondary)]",
    tertiary: "text-[var(--colorTypographyTertiary)]",
    critical: "text-[var(--colorTypographyCritical)]",
    inheritColor: "text-[inherit]",
    ellipsis: "line-clamp-1",
    lineClamp: "lineClamp"
};
export default styles;
export function getStyle(style) {
    return styles[style];
}
