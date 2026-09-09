import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://niver-liene.netlify.app";
const TITLE = "Liene 31 anos — Convite, presença e presentes";
const DESCRIPTION =
  "Convite para celebrar os 31 anos da Liene, com confirmação de presença e sugestões de presentes.";
const SOCIAL_IMAGE = "/liene-whatsapp.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Aniversário da Liene",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Convite de aniversário da Liene — 31 anos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
