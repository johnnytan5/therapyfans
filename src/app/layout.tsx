import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalNavbar } from "@/components/layout/GlobalNavbar";
import { WalletProviders } from "@/components/providers/WalletProviders";
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
  title: "TherapyFans - Anonymous Therapy Platform",
  description: "Connect with licensed therapists through zkLogin anonymity. Web3-powered therapy sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProviders>
          <GlobalNavbar />
          <main className="pt-16">
            {children}
          </main>
        </WalletProviders>
      </body>
    </html>
  );
}
