import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FindTravel - Thoughtful Travel Planning",
  description: "A calm, thoughtful travel planner that designs trips around who you are.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
