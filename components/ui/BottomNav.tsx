"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/home",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z"
          stroke={active ? "#2C2820" : "#9E9488"}
          strokeWidth="1.2"
          fill={active ? "rgba(44,40,32,0.08)" : "none"}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="3" y="4" width="16" height="15"
          rx="3"
          stroke={active ? "#2C2820" : "#9E9488"}
          strokeWidth="1.2"
          fill={active ? "rgba(44,40,32,0.08)" : "none"}
        />
        <path d="M7 2V5M15 2V5M3 8H19" stroke={active ? "#2C2820" : "#9E9488"} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="7.5" cy="12" r="1" fill={active ? "#2C2820" : "#9E9488"} />
        <circle cx="11" cy="12" r="1" fill={active ? "#2C2820" : "#9E9488"} />
        <circle cx="14.5" cy="12" r="1" fill={active ? "#2C2820" : "#9E9488"} />
        <circle cx="7.5" cy="15.5" r="1" fill={active ? "#2C2820" : "#9E9488"} />
        <circle cx="11" cy="15.5" r="1" fill={active ? "#2C2820" : "#9E9488"} />
      </svg>
    ),
  },
  {
    href: "/lists",
    label: "Lists",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M8 6H18M8 11H18M8 16H14" stroke={active ? "#2C2820" : "#9E9488"} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="5" cy="6" r="1" fill={active ? "#2C2820" : "#9E9488"} />
        <circle cx="5" cy="11" r="1" fill={active ? "#2C2820" : "#9E9488"} />
        <circle cx="5" cy="16" r="1" fill={active ? "#2C2820" : "#9E9488"} />
      </svg>
    ),
  },
  {
    href: "/ledger",
    label: "Ledger",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="3" y="3" width="16" height="16"
          rx="3"
          stroke={active ? "#2C2820" : "#9E9488"}
          strokeWidth="1.2"
          fill={active ? "rgba(44,40,32,0.08)" : "none"}
        />
        <path d="M11 7V15M8 10H9.5C9.5 10 11 9.5 11 11C11 12.5 9.5 12 9.5 12H8" stroke={active ? "#2C2820" : "#9E9488"} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M11 11H13C13.8 11 14.5 11.5 14.5 12C14.5 12.8 13.8 13 13 13H11" stroke={active ? "#2C2820" : "#9E9488"} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="2.5" stroke={active ? "#2C2820" : "#9E9488"} strokeWidth="1.2" />
        <path
          d="M11 3V4.5M11 17.5V19M3 11H4.5M17.5 11H19M5.15 5.15L6.2 6.2M15.8 15.8L16.85 16.85M5.15 16.85L6.2 15.8M15.8 6.2L16.85 5.15"
          stroke={active ? "#2C2820" : "#9E9488"}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-cream border-t-[0.5px] border-[rgba(44,40,32,0.12)] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-[56px] max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-[3px] flex-1 py-1 transition-[opacity,transform] duration-150 ease-out active:scale-[0.92] active:opacity-60"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-[500] tracking-[0.06em] uppercase leading-none"
                style={{ color: active ? "#2C2820" : "#9E9488" }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
