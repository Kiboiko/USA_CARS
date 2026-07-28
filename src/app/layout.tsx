import type { Metadata } from "next";
import { Inter, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import MetaPixel from "@/components/MetaPixel";

// Type system — plain, readable US-dealership feel:
// - Inter: body / UI text.
// - Roboto Condensed: bold vehicle titles, prices, section headings.
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
const display = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

// Root layout: html/body only. Public chrome lives in app/(site)/layout.tsx,
// admin chrome in app/admin/layout.tsx — so the admin panel does not render
// the public header/footer.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Used Cars for Sale in the USA`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Used Cars for Sale in the USA`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Used Cars for Sale in the USA`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
