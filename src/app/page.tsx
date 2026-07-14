import Image from "next/image";
import { redirect } from "next/navigation";
import { FaArrowRightLong } from "react-icons/fa6";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { buildLoginHref } from "@/lib/auth/login-href";
import ThemedLoginBanner from "@/app/components/ThemedLoginBanner";
import Logo from "../../public/images/logo.svg";

export default async function Home() {
  if (await getAuthenticatedUser()) redirect("/dashboard");
  const loginHref = await buildLoginHref("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <ThemedLoginBanner
        position="header"
        className="w-full h-1/5 absolute top-0 opacity-90"
      />
      <Image src={Logo} alt="Logo" className="z-50 w-3/4 max-w-sm h-auto" />
      <div>
        <div className="text-3xl font-plus-jakarta-sans max-w-sm text-center">
          Log in
        </div>
        <p className="text-sm p-4 font-plus-jakarta-sans max-w-xs text-center italic">
          Sign in with your uwdatascience.ca account to continue
        </p>
      </div>
      <a
        href={loginHref}
        className="z-50 flex items-center justify-center gap-3 border-2 border-valentine-red px-6 py-2 rounded-full bg-gradient-to-r from-valentine-red to-valentine-pink text-white
        focus:outline-none focus:ring-2 focus:ring-valentine-red focus:ring-opacity-50
        focus:border-valentine-red focus:shadow-[0_0_15px_rgba(255,23,68,0.3)]
        transition-all duration-300 ease-in-out
        hover:shadow-[0_0_10px_rgba(255,23,68,0.2)]
        hover:scale-105 active:scale-95"
      >
        <span>Sign in with your DSC account</span>
        <FaArrowRightLong className="text-sm" />
      </a>
      <ThemedLoginBanner
        position="footer"
        className="w-full h-1/5 absolute bottom-0 opacity-90"
      />
    </main>
  );
}
