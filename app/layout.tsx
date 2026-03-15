// app/layout.tsx
// ADD Navbar and Footer to the root layout

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kratos Engine",
  description: "JSON-driven game engine — Kratos Hackathon 2026",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
