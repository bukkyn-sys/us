"use client";

import { useState, useEffect } from "react";
import {
  subscribeListFolders,
  subscribeListItems,
  type ListFolderRow,
  type ListItemRow,
} from "../db";

export function useLists(groupId: string | null, userId: string | null) {
  const [folders, setFolders] = useState<ListFolderRow[]>([]);
  const [items, setItems] = useState<ListItemRow[]>([]);

  useEffect(() => {
    if (!groupId || !userId) return;
    const unsub1 = subscribeListFolders(groupId, userId, setFolders);
    const unsub2 = subscribeListItems(groupId, setItems);
    return () => {
      unsub1();
      unsub2();
    };
  }, [groupId, userId]);

  return { folders, items };
}
