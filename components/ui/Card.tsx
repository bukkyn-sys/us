import { type HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card rounded-[18px] shadow-card px-5 py-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
