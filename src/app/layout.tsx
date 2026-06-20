import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Providers } from "@/components/Providers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-QDPW5YK7B5";

export const metadata: Metadata = {
  title: "Mannosaar - Mental Health Therapy",
  description: "Professional mental health therapy and counseling services",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              send_page_view: false,
              page_path: window.location.pathname + window.location.search,
            });
          `}
        </Script>
        <Providers>
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
