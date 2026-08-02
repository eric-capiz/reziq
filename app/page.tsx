import type { Metadata } from "next";
import { WelcomeHeader } from "@/components/welcome/header";
import { WelcomeHero } from "@/components/welcome/hero";
import { WelcomePurpose } from "@/components/welcome/purpose";
import { WelcomeHowTo } from "@/components/welcome/how-to";
import { WelcomeCallouts } from "@/components/welcome/callouts";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "RezIQ | Evidence based AI resume fit analysis",
  description:
    "Upload a DOCX resume, paste a job description, and get Strong, Possible, or Poor fit with evidence. Honest recommendations and clean DOCX or PDF exports.",
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RezIQ",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free AI resume analysis that compares your resume to a job description with evidence based fit feedback and honest recommendations.",
  url: getSiteUrl(),
  author: {
    "@type": "Person",
    name: "Eric Capiz",
    url: "https://www.ericcapiz.com",
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WelcomeHeader />
      <WelcomeHero />
      <WelcomePurpose />
      <WelcomeHowTo />
      <WelcomeCallouts />
      <footer className="border-t border-white/10 bg-[#0B0F14] px-4 py-10 text-center text-sm text-white/55 sm:px-6">
        <p>RezIQ helps you improve resumes with evidence, not invented experience.</p>
        <p className="mt-2">
          <a
            href="/privacy"
            className="text-white/60 underline-offset-4 transition-colors duration-200 hover:text-[#7CFFB2] hover:underline"
          >
            Privacy
          </a>
          {" · "}© {new Date().getFullYear()} · Developed by{" "}
          <a
            href="https://www.ericcapiz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#7CFFB2] underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
          >
            Eric Capiz
          </a>
        </p>
      </footer>
    </div>
  );
}
