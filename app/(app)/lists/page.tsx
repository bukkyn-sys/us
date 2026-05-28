"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateListItem } from "@/lib/db";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useGroup } from "@/lib/hooks/useGroup";
import { useLists } from "@/lib/hooks/useLists";
import { WishItem } from "@/components/lists/WishItem";
import { FilterPills } from "@/components/lists/FilterPills";
import { AddItemModal } from "@/components/lists/AddItemModal";

type SortKey = "want_desc" | "price_asc" | "price_desc" | "date_desc";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Most wanted", value: "want_desc" },
  { label: "Price ↑", value: "price_asc" },
  { label: "Price ↓", value: "price_desc" },
  { label: "Newest", value: "date_desc" },
];

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

  const filtered = items.filter((item) => filter === "all" || item.created_by === filter);
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
          <h1 className="font-display text-[26px] font-[300] tracking-[-0.5px] text-ink">Lists</h1>
        </div>

        {/* Filter by person */}
        <FilterPills options={filterOptions} value={filter} onChange={setFilter} />

        {/* Sort row */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 scrollbar-hide">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className="flex-shrink-0 text-[11px] font-[500] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
              style={{
                backgroundColor: sort === s.value ? "#2C2820" : "rgba(44,40,32,0.07)",
                color: sort === s.value ? "#F5F0E8" : "#6B6458",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {sortItems(active).length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10">
            <p className="text-[13px] text-ink3">Nothing here yet.</p>
            <p className="text-[12px] text-ink3">Tap + to add your first item.</p>
          </div>
        )}

        {/* Active items */}
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {sortItems(active).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <WishItem
                  item={item}
                  creatorProfile={memberProfiles[item.created_by]}
                  onGift={() => markGifted(item.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Gifted section */}
        {gifted.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3 mt-2">Gifted</p>
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
      <motion.button
        onClick={() => setShowAdd(true)}
        whileTap={{ scale: 0.91 }}
        className="fixed right-4 z-40 flex items-center gap-2 pl-3 pr-4 rounded-full shadow-lg"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          backgroundColor: "#2C2820",
          height: 48,
          boxShadow: "0 4px 16px rgba(44,40,32,0.28)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-[13px] font-[500] text-cream">Add item</span>
      </motion.button>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <AddItemModal
            groupId={groupId}
            userId={user.id}
            folders={folders}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
