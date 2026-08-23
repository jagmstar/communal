import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Communal — Комунальні платежі одним тапом",
  description: "Фото лічильника → OCR → авто-заповнення EPS → оплата. Забудьте про ручний набір цифр.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Communal",
  },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="uk"
      className={`${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="flex-1 mx-auto w-full max-w-md page-container pt-safe">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
