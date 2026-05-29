"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastMsg = { id: number; text: string };
const listeners: Array<(msg: string) => void> = [];

export function toast(message: string) {
  listeners.forEach((l) => l(message));
}

export function Toaster() {
  const [messages, setMessages] = useState<ToastMsg[]>([]);

  useEffect(() => {
    function handler(text: string) {
      const id = Date.now();
      setMessages((prev) => [...prev, { id, text }]);
      setTimeout(
        () => setMessages((prev) => prev.filter((m) => m.id !== id)),
        2800
      );
    }
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return (
    <div
      className="fixed left-0 right-0 flex flex-col items-center gap-2 z-[200] pointer-events-none"
      style={{ bottom: "calc(70px + env(safe-area-inset-bottom, 0px))" }}
    >
      <AnimatePresence>
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="bg-ink text-cream text-[13px] font-[500] px-4 py-2.5 rounded-full shadow-fab"
          >
            {m.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
