import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kratos Engine — JSON-Driven Game Engine",
  description: "A reusable, plugin-style browser game engine that loads and runs any game from a JSON config file. Built for TapTap Hackathon 2026.",
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
