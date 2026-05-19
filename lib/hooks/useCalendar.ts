"use client";

import { useState, useEffect } from "react";
import { subscribeAvailabilityForMonth, type AvailabilityRow } from "../db";

export function useCalendar(groupId: string | null, yearMonth: string) {
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

  useEffect(() => {
    if (!groupId) return;
    return subscribeAvailabilityForMonth(groupId, yearMonth, setAvailability);
  }, [groupId, yearMonth]);

  return { availability };
}
