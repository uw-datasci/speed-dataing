"use client";

import "./globals.css";
import { store } from "@/store/store";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Provider } from "react-redux";
import { ThemeProvider } from "@/app/ThemeContext";
import UserFetcher from "@/app/components/UserFetcher";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="default">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} antialiased`}
      >
        <Provider store={store}>
          <ThemeProvider>
            <UserFetcher />
            {children}
          </ThemeProvider>
        </Provider>
        <Analytics />
      </body>
    </html>
  );
}
