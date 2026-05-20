import type React from "react";
import type { Metadata, Viewport } from "next";
// import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Capverra - Identity & Asset Management",
  description: "Professional platform for managing identities and assets",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${playfair.variable} ${inter.variable}`}>
      <body className={`${inter.variable} font-sans antialiased bg-background`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
