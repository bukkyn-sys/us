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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/30 z-50 flex items-end"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full bg-card rounded-t-[20px] px-5 pt-5 flex flex-col gap-4"
          style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-[500] text-ink">Add item</h3>
            <button onClick={onClose} className="text-ink3 p-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4L14 14M14 4L4 14" stroke="#9E9488" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">URL (optional)</label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://…"
                className="w-full bg-cream2 rounded-[8px] px-3 py-2.5 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)] pr-8"
              />
              {fetchingOg && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item name"
              maxLength={120}
              className="bg-cream2 rounded-[8px] px-3 py-2.5 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)]"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Price (£)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="bg-cream2 rounded-[8px] px-3 py-2.5 text-[13px] text-ink placeholder:text-ink3 border-[0.5px] border-[rgba(44,40,32,0.12)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Want level</label>
              <div className="flex gap-1.5 items-center h-10">
                {([1, 2, 3] as const).map((l) => (
                  <button key={l} onClick={() => setWantLevel(l)} className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="w-3 h-3 rounded-full transition-colors"
                        style={{ backgroundColor: i <= l ? (l === wantLevel ? "#C4A882" : "#E3DDD3") : "#E3DDD3" }}
                      />
                    ))}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {folders.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-[500] uppercase tracking-[0.08em] text-ink3">Folder (optional)</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFolderId(null)}
                  className={`px-3 py-1.5 rounded-[20px] text-[12px] font-[500] border-[0.5px] transition-colors ${
                    !folderId ? "bg-ink text-cream border-ink" : "bg-cream2 text-ink2 border-[rgba(44,40,32,0.12)]"
                  }`}
                >
                  None
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFolderId(f.id)}
                    className={`px-3 py-1.5 rounded-[20px] text-[12px] font-[500] border-[0.5px] transition-colors ${
                      folderId === f.id ? "bg-ink text-cream border-ink" : "bg-cream2 text-ink2 border-[rgba(44,40,32,0.12)]"
                    }`}
                  >
                    {f.emoji} {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? "Saving…" : "Add to list"}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
