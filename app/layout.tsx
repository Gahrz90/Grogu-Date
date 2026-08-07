import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "Grogu date?",
  description: "Una domanda, due pulsanti. Uno dei due scappa.",
  openGraph: {
    title: "Grogu date?",
    description: "Una domanda, due pulsanti. Uno dei due scappa.",
    type: "website",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grogu date?",
    description: "Una domanda, due pulsanti. Uno dei due scappa.",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
