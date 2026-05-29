"use client";

import Image from "next/image";
import { type ListItemRow, type UserRow } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

interface WishItemProps {
  item: ListItemRow;
  creatorProfile?: UserRow;
  onGift?: () => void;
}

function WantDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-[3px] items-center">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: i <= level ? 7 : 5,
            height: i <= level ? 7 : 5,
            backgroundColor: i <= level ? "#C06B32" : "rgba(28,25,23,0.15)",
          }}
        />
      ))}
    </div>
  );
}

export function WishItem({ item, creatorProfile, onGift }: WishItemProps) {
  const gifted = item.status === "gifted";

  return (
    <div
      className="bg-card rounded-[18px] shadow-card overflow-hidden"
      style={{ opacity: gifted ? 0.5 : 1 }}
    >
      {/* OG image */}
      {item.og_image && (
        <div className="relative w-full bg-cream2" style={{ height: 130 }}>
          <Image
            src={item.og_image}
            alt={item.og_title || item.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-[500] text-ink truncate">{item.og_title || item.title}</p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-ink3 truncate block mt-0.5 active:opacity-60 transition-opacity"
            >
              {new URL(item.url).hostname.replace("www.", "")}
            </a>
          )}
          <div className="flex items-center gap-2.5 mt-2">
            <WantDots level={item.want_level} />
            {item.price != null && (
              <span className="text-[12px] font-[500] text-ink2">{formatCurrency(item.price)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Avatar
            src={creatorProfile?.photo_url}
            name={creatorProfile?.display_name || "?"}
            accentColour={creatorProfile?.accent_colour}
            size={24}
          />
          {!gifted && onGift && (
            <button
              onClick={onGift}
              className="text-[11px] font-[600] text-accent uppercase tracking-[0.05em] active:opacity-60 transition-opacity"
            >
              Gift
            </button>
          )}
          {gifted && (
            <span className="text-[11px] text-green font-[500]">Gifted</span>
          )}
        </div>
      </div>
    </div>
  );
}
