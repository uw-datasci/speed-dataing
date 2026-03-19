/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "../../../public/images/dsclogo-valentines.png";
import { FaRegSmile } from "react-icons/fa";
import { FaRegSmileWink } from "react-icons/fa";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { logout } from "@/store/loginTokenSlice";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { role } = useSelector((state: RootState) => state.auth);

  const handleClick = () => {
    router.push("/dashboard");
  };

  const handleSignOut = () => {
    console.log("[Sign Out] User signed out");
    dispatch(logout());
    router.push("/");
  };

  const handleAdminClick = () => {
    // Check if admin is already verified
    const adminVerified = document.cookie
      .split("; ")
      .find((row) => row.startsWith("adminVerified="))
      ?.split("=")[1];
    if (adminVerified === "true") {
      router.push("/admin");
    } else {
      router.push("/admin/verify");
    }
  };

  const isAdmin = role === "admin";

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
        <span className="text-md md:text-2xl font-bold tracking-wide text-[#FF5252]  font-jakarta">
          Speed <span className="text-[#FF1744] font-jakarta">Data</span>-ing
          Social
        </span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <Button variant="ghost">
          <Link
            href="/dashboard"
            className="text-base text-[#FF5252] cursor-pointer font-semibold font-medium font-jakarta"
          >
            Dashboard
          </Link>
        </Button>

        <Button variant="ghost">
          <Link
            href="/information"
            className="text-base text-[#FF5252] cursor-pointer font-semibold font-medium font-jakarta"
          >
            How it works
          </Link>
        </Button>

        {isAdmin && (
          <Button
            variant="ghost"
            onClick={handleAdminClick}
            className="text-base text-[#FF5252] cursor-pointer font-semibold hover:text-[#FF5252] font-medium transition font-jakarta"
          >
            Admin
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="text-base text-[#FF5252] rounded-xl cursor-pointer font-semibold p-2 hover:text-[#FF5252] transition font-jakarta"
        >
          Log Out
        </Button>
      </div>

      <button
        className="md:hidden flex items-center text-3xl focus:outline-none z-30 font-jakarta"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open menu"
      >
        {menuOpen ? <FaRegSmileWink /> : <FaRegSmile />}
      </button>

      <div
        className={`flex-start fixed inset-0 bg-[#f5e2e3] flex flex-col items-center justify-center gap-4
          transition-transform duration-500 ease-in-out 
          ${menuOpen ? "translate-x-0" : "translate-x-full"}
          z-20 font-jakarta`}
      >
        <div className="items-align-left  flex flex-col gap-10">
          <button
            className="absolute top-6 right-6 text-3xl text-[#FF5252] focus:outline-none font-jakarta"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          ></button>
          <Link
            href="/dashboard"
            className="text-2xl text-jakarta text-[#FF5252] hover:text-[#f5e2e3]-500 font-bold transition font-jakarta"
            onClick={() => setMenuOpen(false)}
          >
            {" "}
            dashboard
          </Link>
          <Link
            href="/information"
            className="text-2xl text-[#FF5252] hover:text-[#f5e2e3]-500 font-bold transition font-jakarta"
            onClick={() => setMenuOpen(false)}
          >
            how it works
          </Link>
          <Link
            href="/survey"
            className="text-2xl text-[#FF5252] hover:text-[#f5e2e3]-500 font-bold transition font-jakarta"
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
              className="text-2xl text-[#FF5252] hover:text-[#f5e2e3]-500 font-bold transition font-jakarta border-2 border-[#FF5252] px-3 py-1 rounded-lg"
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="border border-2 rounded-xl p-2 text-[#FF5252] hover:bg-[#f5e2e3] hover:text-white transition font-jakarta"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
