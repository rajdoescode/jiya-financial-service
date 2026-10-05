import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({
  className,
  size = 40,
  showText = false,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        className="relative overflow-hidden rounded-xl bg-white shadow-sm flex items-center justify-center p-1"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Jiya Financial Services Logo"
          width={size}
          height={size}
          priority
          className="object-contain w-full h-full"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "text-lg font-black tracking-tight leading-none text-[#1e3a8a]",
              textClassName
            )}
          >
            Jiya Financial
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-600 mt-0.5">
            Services
          </span>
        </div>
      )}
    </div>
  );
}
