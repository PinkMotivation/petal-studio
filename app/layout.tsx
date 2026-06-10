import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Petal Studio",
  description: "Premium Tactile Scrapbooks & Planners",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
