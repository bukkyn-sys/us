"use client";

import { useState, useEffect } from "react";
import {
  getGroup,
  subscribeGroupMembers,
  type GroupRow,
  type MemberWithProfile,
  type UserRow,
} from "../db";

export function useGroup(groupId: string | null) {
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    getGroup(groupId).then(setGroup);

    const unsub = subscribeGroupMembers(groupId, (m) => {
      setMembers(m);
      setLoading(false);
    });

    return unsub;
  }, [groupId]);

  const memberProfiles: Record<string, UserRow> = {};
  members.forEach((m) => {
    if (m.profile) memberProfiles[m.user_id] = m.profile;
  });

  return { group, members, memberProfiles, loading };
}
