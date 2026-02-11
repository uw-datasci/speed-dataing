"use client";
import AuthForm from "@/app/components/AuthForm";
import Image from "next/image";
import Footer from "../../public/images/login/gptheader.png"
import Header from "../../public/images/login/gptheader.png"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <Image
      src={Header} alt="Header" 
      className="w-full h-1/5 absolute top-0 opacity-90"/>
      <AuthForm/>
      <Image
      src={Footer} alt="Footer" 
      className="w-full h-1/5 absolute bottom-0 opacity-90"/>
    </main>
  );
}