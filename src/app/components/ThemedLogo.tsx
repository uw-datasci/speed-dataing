"use client";
import Image from "next/image";
import { useTheme } from "@/app/ThemeContext";
import DefaultLogo from "../../../public/images/logo.svg";
import ValentinesLogo from "../../../public/images/logo-valentines-p.svg";

interface ThemedLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

/** The main Speed Data-ing event logo (banner-style), theme-aware. */
export default function ThemedLogo({ className, width = 400, height = 200 }: ThemedLogoProps) {
  const { theme } = useTheme();
  return (
    <Image
      src={theme === "valentines" ? ValentinesLogo : DefaultLogo}
      alt="Speed Data-ing Logo"
      className={className}
      width={width}
      height={height}
    />
  );
}
