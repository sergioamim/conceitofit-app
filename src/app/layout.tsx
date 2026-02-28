import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-face",
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Conceito Fit – Gestão de Academia",
  description: "Conceito Fit · Sistema de gestão para academias",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isReactScanEnabled =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_REACT_SCAN === "true";

  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${display.variable} ${body.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {isReactScanEnabled && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" />
        )}
        {children}
      </body>
    </html>
  );
}
