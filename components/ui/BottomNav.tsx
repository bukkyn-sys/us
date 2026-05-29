"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACCENT = "#C06B32";
const INACTIVE = "#AAA49E";

const tabs = [
  {
    href: "/home",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5L12 3L21 10.5V21H15.5V15.5H8.5V21H3V10.5Z"
          stroke={active ? ACCENT : INACTIVE}
          strokeWidth="1.4"
          fill={active ? `${ACCENT}18` : "none"}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="4" width="18" height="17" rx="4"
          stroke={active ? ACCENT : INACTIVE}
          strokeWidth="1.4"
          fill={active ? `${ACCENT}18` : "none"}
        />
        <path d="M8 2V5M16 2V5M3 9H21" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="13" r="1.2" fill={active ? ACCENT : INACTIVE} />
        <circle cx="12" cy="13" r="1.2" fill={active ? ACCENT : INACTIVE} />
        <circle cx="16" cy="13" r="1.2" fill={active ? ACCENT : INACTIVE} />
        <circle cx="8" cy="17" r="1.2" fill={active ? ACCENT : INACTIVE} />
        <circle cx="12" cy="17" r="1.2" fill={active ? ACCENT : INACTIVE} />
      </svg>
    ),
  },
  {
    href: "/lists",
    label: "Lists",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 6H20M9 12H20M9 18H15" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="5" cy="6" r="1.4" fill={active ? ACCENT : INACTIVE} />
        <circle cx="5" cy="12" r="1.4" fill={active ? ACCENT : INACTIVE} />
        <circle cx="5" cy="18" r="1.4" fill={active ? ACCENT : INACTIVE} />
      </svg>
    ),
  },
  {
    href: "/ledger",
    label: "Ledger",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="3" width="18" height="18" rx="4"
          stroke={active ? ACCENT : INACTIVE}
          strokeWidth="1.4"
          fill={active ? `${ACCENT}18` : "none"}
        />
        <path d="M12 7.5V16.5" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9 10.5H10.5C10.5 10.5 12 10 12 11.5C12 13 10.5 12.5 10.5 12.5H9" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M12 12.5H14C14.8 12.5 15.5 13 15.5 13.5C15.5 14.3 14.8 14.5 14 14.5H12" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card z-40 shadow-nav"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-[62px] max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-[4px] flex-1 py-2 transition-[opacity,transform] duration-150 ease-out active:scale-[0.90] active:opacity-50"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-[600] tracking-[0.05em] uppercase leading-none"
                style={{ color: active ? ACCENT : INACTIVE }}
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
