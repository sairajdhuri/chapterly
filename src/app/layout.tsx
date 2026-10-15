import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chapterly — Better chapters. Clearer writing.",
  description: "A free, private readability editor for authors. Paste your chapter, discover its reading ease, and find the five sentences worth a second look. Your writing stays in your browser.",
  applicationName: "Chapterly",
};

export const viewport: Viewport = { themeColor: "#EAE2D3" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono&family=EB+Garamond:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" /></head><body>{children}</body></html>;
}
