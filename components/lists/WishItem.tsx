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
    <div className="flex gap-[3px]">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: i <= level ? "#C4A882" : "#E3DDD3" }}
        />
      ))}
    </div>
  );
}

export function WishItem({ item, creatorProfile, onGift }: WishItemProps) {
  const gifted = item.status === "gifted";

  return (
    <div
      className="bg-card rounded-[14px] border-[0.5px] border-[rgba(44,40,32,0.07)] overflow-hidden"
      style={{ opacity: gifted ? 0.5 : 1 }}
    >
      {/* OG image */}
      {item.og_image && (
        <div className="relative w-full h-32 bg-cream2">
          <Image
            src={item.og_image}
            alt={item.og_title || item.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="px-3 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-[500] text-ink truncate">{item.og_title || item.title}</p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-ink3 truncate block"
            >
              {new URL(item.url).hostname.replace("www.", "")}
            </a>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <WantDots level={item.want_level} />
            {item.price != null && (
              <span className="text-[11px] text-ink2">{formatCurrency(item.price)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Avatar
            src={creatorProfile?.photo_url}
            name={creatorProfile?.display_name || "?"}
            accentColour={creatorProfile?.accent_colour}
            size={22}
          />
          {!gifted && onGift && (
            <button
              onClick={onGift}
              className="text-[10px] font-[500] text-accent uppercase tracking-[0.06em]"
            >
              Gift
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
