"use client";
import Image from "next/image";
import { useTheme } from "@/app/ThemeContext";
import DefaultHeader from "../../../public/images/login/header.png";
import ValentinesHeader from "../../../public/images/login/gptheader.png";
import DefaultFooter from "../../../public/images/login/footer.png";

interface ThemedLoginBannerProps {
  position: "header" | "footer";
  className?: string;
}

/** Login page top/bottom banner images, theme-aware. */
export default function ThemedLoginBanner({ position, className }: ThemedLoginBannerProps) {
  const { theme } = useTheme();
  const isValentines = theme === "valentines";

  if (position === "header") {
    return (
      <Image
        src={isValentines ? ValentinesHeader : DefaultHeader}
        alt="Header"
        className={className}
      />
    );
  }
  // footer: valentines uses the same gptheader image flipped; default has its own footer
  return (
    <Image
      src={isValentines ? ValentinesHeader : DefaultFooter}
      alt="Footer"
      className={className}
      style={isValentines ? { transform: "scaleY(-1)" } : undefined}
    />
  );
}
