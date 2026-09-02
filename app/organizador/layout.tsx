import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin da festa — Liene 31",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrganizerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
