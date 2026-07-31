import { WelcomeHeader } from "@/components/welcome/header";
import { WelcomeHero } from "@/components/welcome/hero";
import { WelcomePurpose } from "@/components/welcome/purpose";
import { WelcomeHowTo } from "@/components/welcome/how-to";
import { WelcomeCallouts } from "@/components/welcome/callouts";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
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
