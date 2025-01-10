// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hedgehog Content Center",
};

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body className="bg-gray-100 text-gray-800 min-h-screen">
//         <header className="bg-white shadow mb-4">
//           <div className="max-w-4xl mx-auto py-4 px-6 flex items-center justify-between">
//             <h1 className="text-lg font-bold">Hedgehog Content Center</h1>
//             {/* nav links */}
//           </div>
//         </header>
//         <main className="max-w-4xl mx-auto px-4 pb-10">{children}</main>
//       </body>
//     </html>
//   );
// }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-800 min-h-screen">
        <header className="bg-white shadow mb-4">
          <div className="max-w-7xl mx-auto py-4 px-6 flex items-center justify-between">
            <h1 className="text-lg font-bold">Hedgehog Content Center</h1>
            <nav className="space-x-4">
              <Link href="/" className="text-blue-600 hover:underline">
                Home
              </Link>
              <Link href="/rfp-qa" className="text-blue-600 hover:underline">
                RFP_QA
              </Link>
              <Link href="/create-faq" className="text-blue-600 hover:underline">
                Create FAQ
              </Link>
              <Link href="/faq" className="text-blue-600 hover:underline">
                FAQ
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 pb-10">{children}</main>
      </body>
    </html>
  );
}
