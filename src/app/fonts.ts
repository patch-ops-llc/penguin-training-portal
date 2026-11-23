import localFont from "next/font/local";

// Fonts are bundled from npm packages and served by the app itself: no request to a font host at build or run time.
// Lexend Deca stands in for HubSpot Sans, which is proprietary.
export const lexend = localFont({
  src: "../../node_modules/@fontsource-variable/lexend-deca/files/lexend-deca-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-lexend",
  display: "swap",
});

export const poppins = localFont({
  src: [
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});
