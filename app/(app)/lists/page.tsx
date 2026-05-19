"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateListItem } from "@/lib/db";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { useLists } from "@/lib/hooks/useLists";
import { WishItem } from "@/components/lists/WishItem";
import { FilterPills } from "@/components/lists/FilterPills";
import { AddItemModal } from "@/components/lists/AddItemModal";

type SortKey = "want_desc" | "price_asc" | "price_desc" | "date_desc";

export default function ListsPage() {
  const { user, profile } = useAuthContext();
  const groupId = profile?.active_group_id ?? null;
  const { members, memberProfiles } = useGroup(groupId);
  const { folders, items } = useLists(groupId, user?.id ?? null);

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("want_desc");
  const [showAdd, setShowAdd] = useState(false);

  if (!user || !profile || !groupId) return null;

  const filterOptions = [
    { label: "All", value: "all" },
    ...members.map((m) => ({
      label: memberProfiles[m.user_id]?.display_name?.split(" ")[0] || "?",
      value: m.user_id,
    })),
  ];

  const sortOptions: { label: string; value: SortKey }[] = [
    { label: "Want ↓", value: "want_desc" },
    { label: "Price ↑", value: "price_asc" },
    { label: "Price ↓", value: "price_desc" },
    { label: "Newest", value: "date_desc" },
  ];

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    return item.created_by === filter;
  });

  const active = filtered.filter((i) => i.status === "active");
  const gifted = filtered.filter((i) => i.status === "gifted");

  function sortItems(arr: typeof active) {
    return [...arr].sort((a, b) => {
      if (sort === "want_desc") return b.want_level - a.want_level;
      if (sort === "price_asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "price_desc") return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });
  }

  async function markGifted(itemId: string) {
    await updateListItem(itemId, { status: "gifted" });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="px-4 pt-12 pb-6 flex flex-col gap-4 max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-[500] tracking-[-0.5px] text-ink">Lists</h1>
          <div className="flex gap-2">
            {sortOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`text-[11px] font-[500] px-2 py-1 rounded-[6px] transition-colors ${
                  sort === s.value ? "bg-ink text-cream" : "text-ink3"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <FilterPills options={filterOptions} value={filter} onChange={setFilter} />

        {/* Items */}
        {sortItems(active).length === 0 && (
          <p className="text-[13px] text-ink3 py-4 text-center">No items yet. Add something!</p>
        )}

        <div className="flex flex-col gap-2">
          {sortItems(active).map((item) => (
            <WishItem
              key={item.id}
              item={item}
              creatorProfile={memberProfiles[item.created_by]}
              onGift={() => markGifted(item.id)}
            />
          ))}
        </div>

        {/* Gifted section */}
        {gifted.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Gifted</p>
            {sortItems(gifted).map((item) => (
              <WishItem
                key={item.id}
                item={item}
                creatorProfile={memberProfiles[item.created_by]}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-[72px] right-4 w-12 h-12 rounded-[14px] bg-ink flex items-center justify-center z-40"
        style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4V16M4 10H16" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Add modal */}
      {showAdd && (
        <AddItemModal
          groupId={groupId}
          userId={user.id}
          folders={folders}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}
