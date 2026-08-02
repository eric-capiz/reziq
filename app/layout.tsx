import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const editorial = Fraunces({
  variable: "--font-editorial",
  subsets: ["latin"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RezIQ | Evidence based AI resume fit analysis",
    template: "%s | RezIQ",
  },
  description:
    "Free AI resume analysis that compares your DOCX resume to a real job description. Get Strong, Possible, or Poor fit with evidence, honest recommendations, and clean exports.",
  applicationName: "RezIQ",
  keywords: [
    "RezIQ",
    "AI resume analysis",
    "resume job fit",
    "ATS resume",
    "resume optimization",
    "evidence based resume feedback",
    "career center resume tool",
  ],
  authors: [{ name: "Eric Capiz", url: "https://www.ericcapiz.com" }],
  creator: "Eric Capiz",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "RezIQ",
    title: "RezIQ | Evidence based AI resume fit analysis",
    description:
      "Match your resume to a real job with proof. Improve only what you can honestly claim, then export DOCX or PDF.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RezIQ | Evidence based AI resume fit analysis",
    description:
      "Free AI resume fit analysis with evidence based feedback and honest recommendations.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "career",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${editorial.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
