import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Providers } from "@/components/Providers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

export const metadata: Metadata = {
  title: {
    default: "Online Counselling in India | Mannosaar",
    template: "%s | Mannosaar",
  },
  description:
    "Private online counselling and emotional support with Neetu Rathore for personal, relationship and everyday emotional concerns.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mannosaar.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Mannosaar",
    title: "Online Counselling in India | Mannosaar",
    description:
      "Private online counselling and emotional support with Neetu Rathore for personal, relationship and everyday emotional concerns.",
    url: "/",
    images: [{ url: "/images/social/community-hero.png", width: 1200, height: 630, alt: "Mannosaar online counselling" }],
  },
  twitter: {
    card: "summary",
    title: "Online Counselling in India | Mannosaar",
    description:
      "Private online counselling and emotional support with Neetu Rathore for personal, relationship and everyday emotional concerns.",
    images: ["/images/social/community-hero.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Mannosaar",
                url: "https://mannosaar.com",
                description:
                  "Private online counselling and emotional support with Neetu Rathore.",
              },
              {
                "@context": "https://schema.org",
                "@type": "Person",
                name: "Neetu Rathore",
                url: "https://mannosaar.com/about",
                image:
                  "https://mannosaar.com/images/ChatGPT%20Image%20Sep%201%2C%202026%2C%2011_36_39%20AM.png",
                description:
                  "Psychologist, family therapist and career counsellor providing online counselling through Mannosaar.",
                knowsLanguage: ["Hindi", "English"],
                sameAs: ["https://www.linkedin.com/in/neeturathore9/"],
              },
            ]),
          }}
        />
        <Providers>
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
