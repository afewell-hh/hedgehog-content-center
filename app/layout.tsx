// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { Montserrat } from "@next/font/google";

const montserrat = Montserrat({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Hedgehog Content Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="bg-background text-text min-h-screen flex flex-col">
        <header className="bg-white shadow mb-4 sticky top-0 z-50">
          <div className="container mx-auto px-6 flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/Hedgehog-color-large.svg"
                alt="Hedgehog Logo"
                width={150}
                height={50}
              />
              <h1 className="text-lg font-bold text-primary ml-2">
                Content Center
              </h1>
            </Link>
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link href="/" className="nav-link">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/rfp-qa" className="nav-link">
                    RFP_QA
                  </Link>
                </li>
                <li>
                  <Link href="/create-faq" className="nav-link">
                    Create FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="nav-link">
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-6 pb-10 flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}