"use client";

import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger";
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
    "text-[14px] font-[500] rounded-[14px] px-4 py-[14px] transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] active:opacity-70 disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:opacity-25";

  const variants = {
    primary: "bg-ink text-cream",
    outline: "bg-card text-ink border border-[rgba(28,25,23,0.10)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
    danger: "bg-[#FDECEA] text-[#C04843] border border-[rgba(192,72,67,0.15)]",
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
