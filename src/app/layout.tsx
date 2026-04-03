import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuralLang — Next-Generation Programming Language for AI",
  description:
    "Tulis neural networks seperti matematika, bukan seperti software. Bahasa pemrograman next-gen untuk Artificial Intelligence yang dibangun dengan Rust.",
  keywords: [
    "NeuralLang",
    "AI",
    "machine learning",
    "deep learning",
    "programming language",
    "Rust",
    "neural networks",
    "PyTorch",
  ],
  authors: [{ name: "NeuralLang Team" }],
  icons: {
    icon: "/neurallang-logo.png",
  },
  openGraph: {
    title: "NeuralLang — Next-Generation Programming Language for AI",
    description: "Tulis neural networks seperti matematika, bukan seperti software.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#0a0a0a", color: "#e5e5e5" }}
      >
        {children}
      </body>
    </html>
  );
}
