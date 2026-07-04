import React from "react";
import Dashboard from "./Dashboard";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Logo from "../../../../public/images/logo-valentines-p.svg";
import Image from "next/image";

export const metadata = {
  title: "Dashboard",
  description: "View your matches and event information.",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF7FA]">
      <Navbar />
      <Image
        src={Logo}
        alt="Logo"
        className="w-2/5 lg:w-1/3 h-auto mx-auto pt-0 pb-0 -mt-2 -mb-3"
      />
      <Dashboard />
      <Footer />
    </div>
  );
}
