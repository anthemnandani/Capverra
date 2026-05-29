import type React from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Providers } from "./providers";
import "./globals.css";

import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: "Capverra - Identity & Asset Management",
  description: "Professional platform for managing identities and assets",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable}`}
    >
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />

            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                
                function gtag() {
                  dataLayer.push(arguments);
                }

                gtag('js', new Date());
                gtag('config', '${GA_ID}');
                 console.log('Google Analytics ID:', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>

      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}