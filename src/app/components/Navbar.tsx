/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DefaultLogo from "../../../public/images/dscLogo.png";
import ValentinesLogo from "../../../public/images/dsclogo-valentines.png";
import { FaRegSmile } from "react-icons/fa";
import { FaRegSmileWink } from "react-icons/fa";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useTheme } from "@/app/ThemeContext";
import { useRouter } from "next/navigation";
import axios from "axios";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.data);
  const { theme } = useTheme();
  const Logo = theme === "valentines" ? ValentinesLogo : DefaultLogo;

  const handleClick = () => {
    router.push("/dashboard");
  };

  const handleSignOut = async () => {
    try {
      await axios.post("/api/auth/signout");
    } catch (e) {
      console.error("[Sign Out] Failed to clear session", e);
    }
    window.location.href = "/";
  };

  const handleAdminClick = () => {
    router.push("/admin");
  };

  const isAdmin = user?.isAdmin ?? false;

  return (
    <nav className="sticky no-scrollbar overflow-hidden z-70 top-0 w-full flex items-center justify-between px-6 py-6 bg-white shadow-sm relative z-20 rounded-b-2xl font-jakarta">
      <div className="flex items-center">
        <Image
          src={Logo}
          onClick={handleClick}
          alt="Logo"
          className="w-8 h-8 md:w-12 md:h-12 cursor-pointer"
        />
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
        <span className="text-md md:text-2xl font-bold tracking-wide text-valentine-lightRed font-jakarta">
          Speed <span className="text-valentine-red font-jakarta">Data</span>-ing
          Social
        </span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <Link
          href="/dashboard"
          className="text-valentine-lightRed cursor-pointer font-semibold hover:bg-valentine-light font-medium transition font-jakarta"
        >
          Dashboard
        </Link>
        <Link
          href="/information"
          className="text-valentine-lightRed cursor-pointer font-semibold hover:bg-valentine-light font-medium transition font-jakarta"
        >
          How it works
        </Link>
        {isAdmin && (
          <button
            onClick={handleAdminClick}
            className="text-valentine-lightRed cursor-pointer font-semibold hover:bg-valentine-light font-medium transition font-jakarta border-2 border-valentine-lightRed px-3 py-1 rounded-lg"
          >
            Admin
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="text-valentine-lightRed rounded-xl cursor-pointer font-semibold p-2 hover:bg-valentine-light transition font-jakarta"
        >
          Log Out
        </button>
      </div>

      <button
        className="md:hidden flex items-center text-3xl focus:outline-none z-30 font-jakarta"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open menu"
      >
        {menuOpen ? <FaRegSmileWink /> : <FaRegSmile />}
      </button>

      <div
        className={`flex-start fixed inset-0 bg-valentine-light flex flex-col items-center justify-center gap-4
          transition-transform duration-500 ease-in-out 
          ${menuOpen ? "translate-x-0" : "translate-x-full"}
          z-20 font-jakarta`}
      >
        <div className="items-align-left flex flex-col gap-10">
          <button
            className="absolute top-6 right-6 text-3xl text-valentine-lightRed focus:outline-none font-jakarta"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          ></button>
          <Link
            href="/dashboard"
            className="text-2xl text-valentine-lightRed hover:opacity-70 font-bold transition font-jakarta"
            onClick={() => setMenuOpen(false)}
          >
            dashboard
          </Link>
          <Link
            href="/information"
            className="text-2xl text-valentine-lightRed hover:opacity-70 font-bold transition font-jakarta"
            onClick={() => setMenuOpen(false)}
          >
            how it works
          </Link>
          <Link
            href="/survey"
            className="text-2xl text-valentine-lightRed hover:opacity-70 font-bold transition font-jakarta"
            onClick={() => setMenuOpen(false)}
          >
            form
          </Link>
          {isAdmin && (
            <button
              onClick={() => {
                handleAdminClick();
                setMenuOpen(false);
              }}
              className="text-2xl text-valentine-lightRed hover:opacity-70 font-bold transition font-jakarta border-2 border-valentine-lightRed px-3 py-1 rounded-lg"
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="border border-2 rounded-xl p-2 text-valentine-lightRed hover:bg-valentine-red hover:text-white transition font-jakarta"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

