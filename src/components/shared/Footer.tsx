import Link from 'next/link';
import { ArrowUpRight, Mail, Phone } from 'lucide-react';

const exploreLinks = [
  { label: 'Home', href: '/' },
  { label: 'Online counselling', href: '/services' },
  { label: 'Individual counselling', href: '/counselling/individual' },
  { label: 'Couples counselling', href: '/counselling/couples' },
  { label: 'About Neetu Rathore', href: '/about' },
  { label: 'Resources', href: '/blogs' },
  { label: 'Social wellbeing', href: '/social' },
] as const;

const supportLinks = [
  { label: 'Book a session', href: '/book-session' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Frequently asked questions', href: '/faq' },
  { label: 'Pricing', href: '/services' },
  { label: 'Emergency information', href: '/emergency' },
  { label: 'Contact', href: '/#contact' },
] as const;

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Therapy Consent', href: '/online-therapy-consent' },
  { label: 'Data Rights', href: '/data-rights' },
] as const;

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex w-fit items-center gap-1.5 text-sm text-[#d8ccdc] transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b4fe]"
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
    </Link>
  );
}

export default function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden bg-[#24142d] text-white">
      <div className="pointer-events-none absolute -left-24 top-28 h-72 w-72 rounded-full bg-[#77479a]/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#b477b4]/15 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 pb-7 pt-12 sm:px-6 sm:pt-14 lg:px-8">
        <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.7fr_0.8fr_1fr] lg:gap-8 lg:pb-14">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b4fe]" aria-label="Mannosaar home">
              {/* This local brand mark is intentionally a plain image. Keeping the
                  global footer free of Next's lazy image boundary prevents a stale
                  dev chunk from crashing every route during hot reloads. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mannosaar_logog_only.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
              <span>
                <span className="block font-playfair text-2xl font-bold leading-none">Mannosaar</span>
                <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cdbfd2]">Heal · Grow · Transform</span>
              </span>
            </Link>
            <p className="mt-5 text-sm leading-6 text-[#cdbfd2]">Compassionate, confidential online counselling designed to meet you where you are.</p>
            <div className="mt-6 space-y-3">
              <a href="mailto:care@mannosaar.com" className="group flex w-fit items-center gap-3 text-sm text-[#eee6f0] transition hover:text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition group-hover:bg-white/10"><Mail className="h-4 w-4" aria-hidden="true" /></span>
                care@mannosaar.com
              </a>
              <a href="tel:+917080633396" className="group flex w-fit items-center gap-3 text-sm text-[#eee6f0] transition hover:text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition group-hover:bg-white/10"><Phone className="h-4 w-4" aria-hidden="true" /></span>
                +91 70806 33396
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white">Explore</h3>
            <nav aria-label="Explore" className="flex flex-col gap-3.5">
              {exploreLinks.map(link => <FooterLink key={link.href} {...link} />)}
            </nav>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white">Support</h3>
            <nav aria-label="Support" className="flex flex-col gap-3.5">
              {supportLinks.map(link => <FooterLink key={link.href} {...link} />)}
            </nav>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white">Legal &amp; privacy</h3>
            <nav aria-label="Legal and privacy" className="flex flex-col gap-3.5">
              {legalLinks.map(link => <FooterLink key={link.href} {...link} />)}
            </nav>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs leading-5 text-[#aa9caf] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mannosaar LLP. All rights reserved.</p>
          <p className="max-w-xl sm:text-right">Mannosaar is not an emergency service. If you are in immediate danger, contact your local emergency services.</p>
        </div>
      </div>
    </footer>
  );
}
