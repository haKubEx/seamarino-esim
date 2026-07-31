import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./Components/layout/Navbar";

// Local fallback Footer component to avoid missing module error
const Footer: React.FC = () => (
  <footer className="w-full border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-600">
    © {new Date().getFullYear()} Seamarino eSIM. All rights reserved.
  </footer>
);

export const metadata: Metadata = {
  title: "Seamarino eSIM | Connect Without Limits",
  description:
    "Affordable eSIM data plans for seafarers, travelers and digital nomads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Navbar />

        {children}

        <Footer />
      </body>
    </html>
  );
}