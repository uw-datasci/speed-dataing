"use client";

import "./globals.css";
import { store } from "@/store/store";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Provider } from "react-redux";
import UserFetcher from "@/app/components/UserFetcher";

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} antialiased`}
      >
        <Provider store={store}>
          <UserFetcher />
          {children}
        </Provider>
      </body>
    </html>
  );
}