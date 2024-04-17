export const COLORS = {
  primary: "#655AFF",
  primaryDark: "#3C3598",
  secondary: "#FCA5A5",
  primaryLight: "#A39CFF",
  secondaryDark: "#FF7A7A",
  secondaryLight: "rgba(252,165,165,0.6)",
  third: "#89D34F",
  thirdDark: "#78B746",
  inputBorder: "#E0E0E0",
  inputBg: "#FAFAFA",
  inputError: "#E6514E",
  inputPlaceholder: "#9E9E9E",
  text: "#2A2A2C",
  bg: "#F5F5F5",
  inputPlaceholderActive: "#222222"
}

export const envName = `${import.meta.env.VITE_APP_CODE || "izi:learn"}:${import.meta.env.APP_ENV || "dev"}`

export const envMode = import.meta.env.MODE
export const API = (() => {
  return import.meta.env.VITE_API
})()


export const DEFAULT_THUMBNAIL = "/default-thumbnail.png"
