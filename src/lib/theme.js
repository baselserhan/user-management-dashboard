// Design tokens for the two supported themes. Every color in the UI comes
// from one of these two palettes, selected in App.jsx via `THEMES[theme]`.
export const THEMES = {
  dark: {
    bg: "#0F1115",
    surface: "#171A21",
    surfaceHover: "#1D212A",
    border: "#262B35",
    text: "#EAECEF",
    textMuted: "#8891A0",
    accent: "#E8A33D", // amber — primary actions
    accentSoft: "#3A2E1B",
    dangerSoft: "#2A1414",
    blue: "#5B8DEF", // admin indicator
    green: "#3DD68C", // active / success
    red: "#E5595E", // destructive / errors
  },
  light: {
    bg: "#F7F7F8",
    surface: "#FFFFFF",
    surfaceHover: "#F0F1F3",
    border: "#E2E4E9",
    text: "#171A21",
    textMuted: "#6B7280",
    accent: "#B45B12", // deepened amber for contrast on white
    accentSoft: "#FBEBD3",
    dangerSoft: "#FCE8E8",
    blue: "#3B5FD9",
    green: "#1FAE74",
    red: "#DC2626",
  },
};
