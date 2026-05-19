import { type HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card rounded-[14px] border-[0.5px] border-[rgba(44,40,32,0.07)] px-4 py-[14px] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
