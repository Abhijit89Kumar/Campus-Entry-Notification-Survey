import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Campus Entry Survey Analytics",
  description: "Analytics dashboard for campus entry/exit monitoring policy survey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AnimatedBackground />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-[280px] p-4 pt-20 lg:pt-8 lg:p-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
