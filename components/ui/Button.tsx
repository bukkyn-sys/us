"use client";

import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = true,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "text-[14px] font-[500] rounded-[14px] px-4 py-[13px] transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] active:opacity-75 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants = {
    primary: "bg-ink text-cream",
    outline: "bg-card text-ink border-[0.5px] border-[rgba(44,40,32,0.12)]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
