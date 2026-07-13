"use client";
import AuthForm from "@/app/components/AuthForm";
import ThemedLoginBanner from "@/app/components/ThemedLoginBanner";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <ThemedLoginBanner position="header" className="w-full h-1/5 absolute top-0 opacity-90" />
      <AuthForm/>
      <ThemedLoginBanner position="footer" className="w-full h-1/5 absolute bottom-0 opacity-90" />
    </main>
  );
}