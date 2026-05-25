import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Role0 — Menos solidão, mais rolê",
  description:
    "Facilitador de experiências coletivas. Encontre rolês, grupos e lugares.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Role0",
  },
};

export const viewport: Viewport = {
  themeColor: "#e03800",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1, // Previne zoom no input em iOS
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Script
          id="google-maps"
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=visualization`}
          strategy="afterInteractive"
        />
        <Script id="sw-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    if (process.env.NODE_ENV !== 'production') {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    }
                  },
                  function(err) {
                    if (process.env.NODE_ENV !== 'production') {
                      console.log('Service Worker registration failed: ', err);
                    }
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
