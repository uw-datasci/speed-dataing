/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { login } from "@/store/loginTokenSlice";
import { sendSignInInfo } from "@/utils/apiCalls";
import { useRouter } from "next/navigation";
import { FaArrowRightLong } from "react-icons/fa6";
import Logo from "../../../public/images/logo.svg";
import Image from "next/image";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log(`[Login Attempt] Email: ${email}`);

    try {
      const { data } = await sendSignInInfo({ email, password, secretKey });
      console.log(`[Login Success] User: ${data.name}, Role: ${data.role}`);

      dispatch(
        login({
          name: data.name,
          token: data.accessToken,
          role: data.role,
        })
      );

      // Navigate to dashboard
      router.push("/dashboard");

      // Auto-refresh after navigation
      window.location.reload();
    } catch (e: any) {
      console.error(`[Login Failed] Email: ${email}, Error: ${e.message}`);
      setError("Invalid email or password");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 ">
      <Image src={Logo} alt="Logo" className="z-50 w-3/4 h-auto" />
      <div>
        <div className="text-3xl font-plus-jakarta-sans max-w-sm text-center">
          Log in
        </div>
        <p className="text-sm p-4 font-plus-jakarta-sans max-w-xs text-center italic">
          Please Log In with Your DSC Account Credentials
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <input
          type="email"
          required
          placeholder="Email"
          className="border border-2 border-valentine-red p-2 rounded-full pl-6 text-valentine-red
          hover:shadow-[0_0_10px_rgba(255,23,68,0.2)]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Password"
          className="border border-2 border-valentine-red p-2 rounded-full pl-6 text-valentine-red
          hover:shadow-[0_0_10px_rgba(255,23,68,0.2)]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Event Key"
          className="border border-2 border-valentine-red p-2 rounded-full pl-6 text-valentine-red
          hover:shadow-[0_0_10px_rgba(255,23,68,0.2)]"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
        <div className="text-xs font-plus-jakarta-sans max-w-xs text-center italic">
          Please Ask Organizers for Event key
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="z-50 flex items-center justify-center gap-3 border-2 border-valentine-red px-6 py-2 rounded-full bg-gradient-to-r from-valentine-red to-valentine-pink text-white
        focus:outline-none focus:ring-2 focus:ring-valentine-red focus:ring-opacity-50 
        focus:border-valentine-red focus:shadow-[0_0_15px_rgba(255,23,68,0.3)]
        transition-all duration-300 ease-in-out
        hover:shadow-[0_0_10px_rgba(255,23,68,0.2)]
        hover:scale-105 active:scale-95"
        >
          <span>Continue</span>
          <FaArrowRightLong className="text-sm" />
        </button>
      </form>
    </main>
  );
}
