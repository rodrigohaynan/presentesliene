import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liene 31 anos — Convite, presença e presentes",
  description: "Convite para celebrar os 31 anos da Liene, com confirmação de presença e sugestões de presentes.",
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
