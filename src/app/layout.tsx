import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap" });
const mono = VT323({ weight: "400", subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "PixelGym RPG",
  description: "Registra tus entrenos, gana EXP y evoluciona tu avatar pixel-art.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "PixelGym", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0d17",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${pixel.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
