import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RiskTab } from "@/components/ui/risk-tab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ClauseKeeper — Contract & licensing tracking for creative freelancers",
  description:
    "Track client contracts and licensing terms in one place. AI flags usage-rights, exclusivity, and renewal clauses so nothing slips past freelance video editors, photographers, and designers.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ClauseKeeper — Contract & licensing tracking for creative freelancers",
    description:
      "AI flags the usage-rights and exclusivity clauses that actually matter in your client contracts.",
    url: "/",
    siteName: "ClauseKeeper",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClauseKeeper — Contract & licensing tracking for creative freelancers",
    description:
      "AI flags the usage-rights and exclusivity clauses that actually matter in your client contracts.",
  },
};

const FAQ_ITEMS = [
  {
    q: "Who is ClauseKeeper built for?",
    a: "Freelance video editors, photographers, and designers, and small creative agencies who sign client contracts with licensing and usage-rights terms.",
  },
  {
    q: "What does the AI clause analysis actually do?",
    a: "Upload a signed contract PDF and it flags usage-rights scope, exclusivity clauses, licensing renewal terms, payment schedule, termination notice, and liability caps — rated by risk to you, the freelancer.",
  },
  {
    q: "Is my contract data private?",
    a: "Yes. Contracts and clause flags are scoped to your organization only, enforced on every request server-side, not just hidden in the interface.",
  },
  {
    q: "Does it work offline or without internet?",
    a: "ClauseKeeper is a web app that requires an internet connection to sync your data and run clause analysis.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClauseKeeper",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Contract and licensing tracking for freelance creatives, with AI-assisted clause flagging.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="mx-auto max-w-shell px-6 py-16">
        <nav className="mb-16 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-ink">ClauseKeeper</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-muted hover:text-ink">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </nav>

        <section className="mx-auto max-w-prose text-center">
          <h1 className="font-display text-3xl text-ink">
            Never miss the clause that costs you the job
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Track client contracts and licensing terms in one place. AI flags usage-rights,
            exclusivity, and renewal clauses — built for freelance video editors, photographers,
            and designers, not enterprise legal teams.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup">
              <Button>Start free</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">View demo</Button>
            </Link>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-3 gap-6">
          <div className="rounded-card border border-border bg-surface-raised p-6">
            <RiskTab level="high" label="Usage rights" />
            <p className="mt-4 text-sm text-ink-muted">
              Catch scope-creep before it happens — know exactly what a client is licensed to do
              with your work.
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface-raised p-6">
            <RiskTab level="medium" label="Exclusivity" />
            <p className="mt-4 text-sm text-ink-muted">
              Spot exclusivity clauses that could block you from taking other client work.
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface-raised p-6">
            <RiskTab level="low" label="Licensing renewal" />
            <p className="mt-4 text-sm text-ink-muted">
              Get ahead of auto-renewal deadlines instead of discovering them after they&apos;ve passed.
            </p>
          </div>
        </section>

        <section className="mt-20 mx-auto max-w-prose">
          <h2 className="font-display text-xl text-ink">Frequently asked questions</h2>
          <div className="mt-6 flex flex-col gap-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q}>
                <h3 className="font-medium text-ink">{item.q}</h3>
                <p className="mt-1 text-sm text-ink-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-20 border-t border-border pt-8 text-center text-xs text-ink-faint">
          <p>
            Built for the{" "}
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Digital Heroes
            </a>{" "}
            Full Stack Developer trial task.
          </p>
        </footer>
      </main>
    </>
  );
}
