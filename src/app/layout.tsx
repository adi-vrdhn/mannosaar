import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Providers } from "@/components/Providers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { DEFAULT_SOCIAL_IMAGE, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Online Counselling in India | Mannosaar",
    template: "%s | Mannosaar",
  },
  description:
    "Private online counselling and emotional support with Neetu Rathore for personal, relationship and everyday emotional concerns.",
  metadataBase: new URL(SITE_URL),
  robots: {
    index: true,
    follow: true,
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    siteName: "Mannosaar",
    title: "Online Counselling in India | Mannosaar",
    description:
      "Private online counselling and emotional support with Neetu Rathore for personal, relationship and everyday emotional concerns.",
    images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: "Mannosaar online counselling" }],
  },
  twitter: {
    card: "summary",
    title: "Online Counselling in India | Mannosaar",
    description:
      "Private online counselling and emotional support with Neetu Rathore for personal, relationship and everyday emotional concerns.",
    images: [DEFAULT_SOCIAL_IMAGE],
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
                url: SITE_URL,
                description:
                  "Private online counselling and emotional support with Neetu Rathore.",
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Mannosaar LLP",
                url: SITE_URL,
                logo: `${SITE_URL}/images/mannosaar-logo.png`,
                email: "care@mannosaar.com",
                telephone: "+91-70806-33396",
              },
              {
                "@context": "https://schema.org",
                "@type": "Person",
                name: "Neetu Rathore",
                url: `${SITE_URL}/about`,
                image:
                  `${SITE_URL}/images/ChatGPT%20Image%20Sep%201%2C%202026%2C%2011_36_39%20AM.png`,
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
