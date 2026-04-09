import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { AppQueryProvider } from "@/lib/query/query-provider";
import { getAppEnv } from "@/lib/env";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { CriticalThemeServer } from "@/components/layout/critical-theme-server";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-face",
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Conceito Fit – Gestão de Academia",
  description: "Conceito Fit · Sistema de gestão para academias",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/pwa-icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Conceito Fit",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  getAppEnv();

  const isReactScanEnabled =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEBUG_REACT_SCAN === "true";

  return (
    <html lang="pt-BR" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#16181c" />
        <CriticalThemeServer />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="academia-theme"
        >
          <AppQueryProvider>
            {isReactScanEnabled && (
              <Script
                src="https://unpkg.com/react-scan/dist/auto.global.js"
                strategy="afterInteractive"
                crossOrigin="anonymous"
              />
            )}
            {children}
            <ServiceWorkerRegister />
            <InstallPrompt />
          </AppQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
