import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CivicPulse",
    template: "%s | CivicPulse",
  },
  description: "India's crowdsourced civic issue reporting platform",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="flex h-screen overflow-hidden bg-[#f0f4f8]">
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto lg:pt-0 pt-14 fade-in">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
