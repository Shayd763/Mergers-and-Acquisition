import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NavigationTransition } from "./components/NavigationTransition";
import { Providers } from "./components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono  = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "Triage Finance · UK M&A Deal Intelligence",
  description: "End-to-end deal analysis, credit scoring, and lender routing for UK business acquisitions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${mono.variable}`}>
      <body className="min-h-full flex flex-col antialiased">
        <NavigationTransition />
        <Providers>
          <main id="main-content" tabIndex={-1} style={{ outline: "none" }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
