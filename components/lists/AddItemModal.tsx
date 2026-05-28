"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addListItem, type ListFolderRow } from "@/lib/db";
import { Button } from "@/components/ui/Button";

interface AddItemModalProps {
  groupId: string;
  userId: string;
  folders: ListFolderRow[];
  onClose: () => void;
}

export function AddItemModal({ groupId, userId, folders, onClose }: AddItemModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [wantLevel, setWantLevel] = useState<1 | 2 | 3>(2);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingOg, setFetchingOg] = useState(false);
  const [ogTitle, setOgTitle] = useState<string | null>(null);
  const [ogImage, setOgImage] = useState<string | null>(null);
  const urlDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleUrlChange(val: string) {
    setUrl(val);
    if (urlDebounce.current) clearTimeout(urlDebounce.current);
    if (!val.startsWith("http")) return;
    urlDebounce.current = setTimeout(async () => {
      setFetchingOg(true);
      try {
        const fnUrl = process.env.NEXT_PUBLIC_OG_FUNCTION_URL;
        if (!fnUrl) return;
        const res = await fetch(`${fnUrl}?url=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          setOgTitle(data.title || null);
          setOgImage(data.image || null);
          if (data.title && !title) setTitle(data.title);
        }
      } finally {
        setFetchingOg(false);
      }
    }, 1000);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await addListItem({
      group_id: groupId,
      folder_id: folderId,
      title: title.trim(),
      url: url || null,
      og_image: ogImage,
      og_title: ogTitle,
      price: price ? parseFloat(price) : null,
      want_level: wantLevel,
      created_by: userId,
      status: "active",
    });
    setSaving(false);
    onClose();
  }

  const WANT_LABELS = ["Nice to have", "Would love it", "Really want"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-ink/40 z-50 flex items-end"
        style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
          className="w-full bg-card rounded-t-[24px] flex flex-col"
          style={{
            maxHeight: "90vh",
            paddingBottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(44,40,32,0.15)" }} />
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex flex-col gap-5 px-5 pt-3 pb-2">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-[18px] font-[500] text-ink">Add to list</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors active:bg-cream2"
                style={{ backgroundColor: "rgba(44,40,32,0.06)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3L11 11M11 3L3 11" stroke="#9E9488" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-[600] uppercase tracking-[0.1em] text-ink3">URL (optional)</label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-cream2 rounded-[10px] px-3 py-3 text-[14px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)] pr-9 outline-none focus:border-accent transition-colors"
                />
                {fetchingOg && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                )}
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-[600] uppercase tracking-[0.1em] text-ink3">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is it?"
                maxLength={120}
                className="bg-cream2 rounded-[10px] px-3 py-3 text-[14px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)] outline-none focus:border-accent transition-colors"
                autoFocus
              />
            </div>

            {/* Price + Want level */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 w-28">
                <label className="text-[10px] font-[600] uppercase tracking-[0.1em] text-ink3">Price (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink3">£</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-cream2 rounded-[10px] pl-6 pr-3 py-3 text-[14px] text-ink border-[0.5px] border-[rgba(44,40,32,0.12)] outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[10px] font-[600] uppercase tracking-[0.1em] text-ink3">How much do you want it?</label>
                <div className="flex gap-2 h-[46px] items-center">
                  {([1, 2, 3] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setWantLevel(l)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-[8px] h-full transition-colors"
                      style={{
                        backgroundColor: wantLevel === l ? "#EDE0CC" : "rgba(44,40,32,0.05)",
                        border: wantLevel === l ? "0.5px solid #C4A882" : "0.5px solid transparent",
                      }}
                    >
                      {[1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: i <= l ? (wantLevel === l ? "#C4A882" : "#C4A882") : "#E3DDD3" }}
                        />
                      ))}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-ink3">{WANT_LABELS[wantLevel - 1]}</p>
              </div>
            </div>

            {/* Folder */}
            {folders.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-[600] uppercase tracking-[0.1em] text-ink3">Folder (optional)</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFolderId(null)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-[500] transition-colors"
                    style={{
                      backgroundColor: !folderId ? "#2C2820" : "rgba(44,40,32,0.07)",
                      color: !folderId ? "#F5F0E8" : "#6B6458",
                    }}
                  >
                    None
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFolderId(f.id)}
                      className="px-3 py-1.5 rounded-full text-[12px] font-[500] transition-colors"
                      style={{
                        backgroundColor: folderId === f.id ? "#2C2820" : "rgba(44,40,32,0.07)",
                        color: folderId === f.id ? "#F5F0E8" : "#6B6458",
                      }}
                    >
                      {f.emoji} {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? "Adding…" : "Add to list"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
