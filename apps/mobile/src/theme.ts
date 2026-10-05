/** Design tokens — mirrors apps/web/src/app/globals.css so the app matches the website. */
export const colors = {
  canvas: "#fbfaf8",
  surface: "#ffffff",
  subtle: "#f4f2ee",
  muted: "#ebe8e2",
  line: "#e4e0d8",
  lineStrong: "#cfc9bd",

  ink: "#1b1a17",
  inkSoft: "#3d3a34",
  inkMuted: "#6f6a60",
  inkFaint: "#9a948a",

  brand: "#1f3d33",
  brandHover: "#2a4f43",
  brandTint: "#e6eee9",

  sale: "#b4442a",
  saleTint: "#f8e9e4",
  success: "#2f6b4a",
  successTint: "#e5f1ea",
  warning: "#94620f",
  warningTint: "#fbf0d9",
  danger: "#b42318",
  dangerTint: "#fdecea",
  white: "#ffffff",
} as const;

export const fonts = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  display: "InstrumentSerif_400Regular",
  displayItalic: "InstrumentSerif_400Regular_Italic",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const shadow = {
  card: {
    shadowColor: "#1b1a17",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pop: {
    shadowColor: "#1b1a17",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
} as const;

/** Horizontal page gutter. */
export const GUTTER = 16;
