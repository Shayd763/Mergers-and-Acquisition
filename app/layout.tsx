import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavigationTransition } from "./components/NavigationTransition";
import { Providers } from "./components/Providers";

export const metadata: Metadata = {
  title: "Triage Finance · UK M&A Deal Intelligence",
  description: "End-to-end deal analysis, credit scoring, and lender routing for UK business acquisitions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <NavigationTransition />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
