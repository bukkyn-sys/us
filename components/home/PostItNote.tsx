"use client";

import { useState, useEffect, useRef } from "react";
import { subscribeGroupNote, setGroupNote, type GroupNoteRow } from "@/lib/db";
import { formatDistanceToNow } from "@/lib/utils";

interface PostItNoteProps {
  groupId: string;
  userId: string;
  memberNames: Record<string, string>;
}

export function PostItNote({ groupId, userId, memberNames }: PostItNoteProps) {
  const [note, setNote] = useState<GroupNoteRow | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return subscribeGroupNote(groupId, (n) => {
      setNote(n);
      setText(n?.text ?? "");
    });
  }, [groupId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    if (val.length > 280) return;
    setText(val);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await setGroupNote(groupId, val, userId);
      setSaving(false);
    }, 800);
  }

  function autoResize() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }

  const updaterName = note?.updated_by
    ? (memberNames[note.updated_by] || "Someone").split(" ")[0]
    : null;

  const timeAgo = note?.updated_at
    ? formatDistanceToNow(new Date(note.updated_at))
    : null;

  return (
    <div
      className="rounded-[14px] px-4 py-3 relative"
      style={{
        backgroundColor: "#FFF8DC",
        border: "0.5px solid rgba(196,168,130,0.4)",
        borderLeftWidth: 3,
        borderLeftColor: "#C4A882",
        borderLeftStyle: "solid",
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => { handleChange(e); autoResize(); }}
        onInput={autoResize}
        placeholder="Leave a note for the group…"
        maxLength={280}
        rows={3}
        className="w-full bg-transparent text-[15px] text-ink leading-relaxed"
        style={{
          fontFamily: "'Caveat', cursive",
          border: "none",
          outline: "none",
          resize: "none",
          overflow: "hidden",
          WebkitAppearance: "none",
          boxShadow: "none",
          padding: 0,
        }}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-ink3">{text.length}/280</span>
        {updaterName && timeAgo && (
          <span className="text-[11px] text-ink3">
            {saving ? "Saving…" : `Updated by ${updaterName} · ${timeAgo}`}
          </span>
        )}
      </div>
    </div>
  );
}
