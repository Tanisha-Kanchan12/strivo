import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import {
  clerkLocalization,
  strivoClerkAppearance,
} from "@/lib/clerk-appearance";
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
  title: {
    default: "Strivo | Find Your Study Partner",
    template: "%s | Strivo",
  },
  description:
    "Match with serious Indian students by goals and availability. Study together with accountability tools.",
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={strivoClerkAppearance}
      localization={clerkLocalization}
      disableKeyless
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-strivo-page font-sans antialiased`}
        >
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast: "shadow-card bg-white text-strivo-text",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
