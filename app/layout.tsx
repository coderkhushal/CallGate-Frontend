import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster";
import JoinState, { JoinContext } from "@/context/JoinContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CallGate",
  description: "A web application let you connect to anybody anytime",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <JoinState>

      <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster/>
        </body>
    </html>
      </JoinState>
    </ClerkProvider>
    
  );
}
