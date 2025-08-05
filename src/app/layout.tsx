import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FCT.fyi - Facet Native Gas Token Analytics & Mint Rate Tracker",
  description: "Real-time FCT (Facet Compute Token) analytics dashboard. Track minting periods, rate adjustments, halvings, and total supply. Monitor the native gas token of the Facet blockchain.",
  openGraph: {
    title: "FCT.fyi - Facet Native Gas Token Analytics",
    description: "Real-time tracking and analytics for FCT, the native gas token of Facet blockchain. Monitor minting periods, rate adjustments, and supply dynamics.",
    url: "https://fct.fyi",
    siteName: "FCT.fyi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FCT.fyi - Facet Gas Token Analytics",
    description: "Real-time FCT analytics: minting periods, rate adjustments, halvings, and supply tracking",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
