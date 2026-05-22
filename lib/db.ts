import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Row types (match the SQL schema) ─────────────────────────────────────────

export interface UserRow {
  id: string;
  display_name: string;
  photo_url: string | null;
  accent_colour: string;
  active_group_id: string | null;
  created_at: string;
}

export interface GroupRow {
  id: string;
  name: string;
  type: "couple" | "group";
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
}

export interface MoodCheckinRow {
  id: string;
  user_id: string;
  group_id: string;
  date: string;
  emoji_index: number;
  updated_at: string;
}

export interface GroupNoteRow {
  group_id: string;
  text: string;
  updated_by: string;
  updated_at: string;
}

export interface CountdownRow {
  id: string;
  group_id: string;
  title: string;
  date: string;
  emoji: string;
  created_by: string;
  archived: boolean;
  created_at: string;
}

export interface AvailabilityRow {
  id: string;
  user_id: string;
  group_id: string;
  date: string;
  status: "free" | "busy";
}

export interface ListFolderRow {
  id: string;
  group_id: string;
  name: string;
  emoji: string;
  hidden_from: string[];
  created_by: string;
  created_at: string;
}

export interface ListItemRow {
  id: string;
  group_id: string;
  folder_id: string | null;
  title: string;
  url: string | null;
  og_image: string | null;
  og_title: string | null;
  price: number | null;
  want_level: 1 | 2 | 3;
  created_by: string;
  status: "active" | "gifted" | "archived";
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  group_id: string;
  title: string;
  total: number;
  paid_by: string;
  splits: { user_id: string; pct: number; amount: number }[];
  date: string;
  created_by: string;
  created_at: string;
}

export interface SettlementRow {
  id: string;
  expense_id: string;
  debtor_id: string;
  creditor_id: string;
  settled_at: string;
}

export interface SavingPotRow {
  id: string;
  folder_id: string | null;
  group_id: string;
  name: string;
  goal_amount: number | null;
  viewers: string[];
  contributors: string[];
  created_by: string;
  created_at: string;
}

export interface PotContributionRow {
  id: string;
  pot_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUser(id: string): Promise<UserRow | null> {
  const { data } = await supabase.from("users").select("*").eq("id", id).single();
  return data;
}

export async function upsertUser(id: string, data: Partial<Omit<UserRow, "id" | "created_at">>) {
  const { error } = await supabase.from("users").upsert({ id, ...data }, { onConflict: "id" });
  if (error) throw error;
}

export async function updateUser(id: string, data: Partial<Omit<UserRow, "id" | "created_at">>) {
  await supabase.from("users").update(data).eq("id", id);
}

export async function getUsers(ids: string[]): Promise<UserRow[]> {
  if (!ids.length) return [];
  const { data } = await supabase.from("users").select("*").in("id", ids);
  return data ?? [];
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function getGroup(id: string): Promise<GroupRow | null> {
  const { data } = await supabase.from("groups").select("*").eq("id", id).single();
  return data;
}

export async function createGroup(
  data: Omit<GroupRow, "id" | "created_at">
): Promise<GroupRow> {
  const { data: row, error } = await supabase
    .from("groups")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function getGroupByInviteCode(code: string): Promise<GroupRow | null> {
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", code.toUpperCase())
    .single();
  return data;
}

// ── Group members ─────────────────────────────────────────────────────────────

export async function addGroupMember(
  groupId: string,
  userId: string,
  role: "owner" | "member"
) {
  await supabase
    .from("group_members")
    .upsert({ group_id: groupId, user_id: userId, role }, { onConflict: "group_id,user_id" });
}

export async function getGroupMembers(groupId: string): Promise<GroupMemberRow[]> {
  const { data } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId);
  return data ?? [];
}

// ── Mood checkins ─────────────────────────────────────────────────────────────

export async function getMoodCheckins(
  groupId: string,
  date: string
): Promise<MoodCheckinRow[]> {
  const { data } = await supabase
    .from("mood_checkins")
    .select("*")
    .eq("group_id", groupId)
    .eq("date", date);
  return data ?? [];
}

export async function setMoodCheckin(
  groupId: string,
  userId: string,
  date: string,
  emojiIndex: number
) {
  await supabase.from("mood_checkins").upsert(
    { user_id: userId, group_id: groupId, date, emoji_index: emojiIndex, updated_at: new Date().toISOString() },
    { onConflict: "user_id,group_id,date" }
  );
}

export async function deleteMoodCheckin(
  groupId: string,
  userId: string,
  date: string
) {
  await supabase
    .from("mood_checkins")
    .delete()
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("date", date);
}

export function subscribeMoodCheckins(
  groupId: string,
  date: string,
  callback: (rows: MoodCheckinRow[]) => void
): () => void {
  let current: MoodCheckinRow[] = [];

  getMoodCheckins(groupId, date).then((rows) => {
    current = rows;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`mood_checkins:${groupId}:${date}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "mood_checkins", filter: `group_id=eq.${groupId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as MoodCheckinRow;
          if (row.date !== date) return;
          current = [...current.filter((r) => r.user_id !== row.user_id), row];
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as MoodCheckinRow;
          if (row.date !== date) return;
          current = current.map((r) => (r.user_id === row.user_id ? row : r));
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as Partial<MoodCheckinRow>;
          current = current.filter((r) => r.id !== row.id);
        }
        callback(current);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── Group note ────────────────────────────────────────────────────────────────

export async function getGroupNote(groupId: string): Promise<GroupNoteRow | null> {
  const { data } = await supabase
    .from("group_notes")
    .select("*")
    .eq("group_id", groupId)
    .single();
  return data;
}

export async function setGroupNote(
  groupId: string,
  text: string,
  userId: string
) {
  await supabase.from("group_notes").upsert(
    { group_id: groupId, text, updated_by: userId, updated_at: new Date().toISOString() },
    { onConflict: "group_id" }
  );
}

export function subscribeGroupNote(
  groupId: string,
  callback: (note: GroupNoteRow | null) => void
): () => void {
  getGroupNote(groupId).then(callback);

  const channel: RealtimeChannel = supabase
    .channel(`group_notes:${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "group_notes", filter: `group_id=eq.${groupId}` },
      (payload) => {
        if (payload.eventType === "DELETE") callback(null);
        else callback(payload.new as GroupNoteRow);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── Countdowns ────────────────────────────────────────────────────────────────

export async function getCountdowns(groupId: string): Promise<CountdownRow[]> {
  const { data } = await supabase
    .from("countdowns")
    .select("*")
    .eq("group_id", groupId)
    .eq("archived", false);
  return data ?? [];
}

export async function addCountdown(
  data: Omit<CountdownRow, "id" | "archived" | "created_at">
) {
  await supabase.from("countdowns").insert({ ...data, archived: false });
}

export async function archiveCountdown(id: string) {
  await supabase.from("countdowns").update({ archived: true }).eq("id", id);
}

export function subscribeCountdowns(
  groupId: string,
  callback: (rows: CountdownRow[]) => void
): () => void {
  let current: CountdownRow[] = [];

  getCountdowns(groupId).then((rows) => {
    current = rows;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`countdowns:${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "countdowns", filter: `group_id=eq.${groupId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          current = [...current, payload.new as CountdownRow];
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as CountdownRow;
          if (row.archived) {
            current = current.filter((r) => r.id !== row.id);
          } else {
            current = current.map((r) => (r.id === row.id ? row : r));
          }
        } else if (payload.eventType === "DELETE") {
          current = current.filter((r) => r.id !== (payload.old as Partial<CountdownRow>).id);
        }
        callback(current);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── Availability ──────────────────────────────────────────────────────────────

export async function getAvailabilityForMonth(
  groupId: string,
  yearMonth: string
): Promise<AvailabilityRow[]> {
  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("group_id", groupId)
    .gte("date", `${yearMonth}-01`)
    .lte("date", `${yearMonth}-31`);
  return data ?? [];
}

export async function setAvailability(
  groupId: string,
  userId: string,
  date: string,
  status: "free" | "busy"
) {
  await supabase
    .from("availability")
    .upsert({ user_id: userId, group_id: groupId, date, status }, { onConflict: "user_id,group_id,date" });
}

export async function deleteAvailability(
  groupId: string,
  userId: string,
  date: string
) {
  await supabase
    .from("availability")
    .delete()
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("date", date);
}

export function subscribeAvailabilityForMonth(
  groupId: string,
  yearMonth: string,
  callback: (rows: AvailabilityRow[]) => void
): () => void {
  let current: AvailabilityRow[] = [];

  getAvailabilityForMonth(groupId, yearMonth).then((rows) => {
    current = rows;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`availability:${groupId}:${yearMonth}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "availability", filter: `group_id=eq.${groupId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as AvailabilityRow;
          if (!row.date.startsWith(yearMonth)) return;
          current = [...current.filter((r) => r.id !== row.id), row];
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as AvailabilityRow;
          if (!row.date.startsWith(yearMonth)) return;
          current = current.map((r) => (r.id === row.id ? row : r));
        } else if (payload.eventType === "DELETE") {
          current = current.filter((r) => r.id !== (payload.old as Partial<AvailabilityRow>).id);
        }
        callback(current);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── List folders ──────────────────────────────────────────────────────────────

export async function getListFolders(
  groupId: string,
  userId: string
): Promise<ListFolderRow[]> {
  const { data } = await supabase
    .from("list_folders")
    .select("*")
    .eq("group_id", groupId);
  return (data ?? []).filter((f) => !f.hidden_from?.includes(userId));
}

export function subscribeListFolders(
  groupId: string,
  userId: string,
  callback: (rows: ListFolderRow[]) => void
): () => void {
  let current: ListFolderRow[] = [];

  getListFolders(groupId, userId).then((rows) => {
    current = rows;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`list_folders:${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "list_folders", filter: `group_id=eq.${groupId}` },
      () => {
        // Re-fetch on any change so hidden_from filtering is always correct
        getListFolders(groupId, userId).then((rows) => {
          current = rows;
          callback(current);
        });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── List items ────────────────────────────────────────────────────────────────

export async function getListItems(groupId: string): Promise<ListItemRow[]> {
  const { data } = await supabase
    .from("list_items")
    .select("*")
    .eq("group_id", groupId)
    .in("status", ["active", "gifted"]);
  return data ?? [];
}

export async function addListItem(
  data: Omit<ListItemRow, "id" | "created_at">
) {
  await supabase.from("list_items").insert(data);
}

export async function updateListItem(
  id: string,
  data: Partial<Omit<ListItemRow, "id" | "created_at">>
) {
  await supabase.from("list_items").update(data).eq("id", id);
}

export function subscribeListItems(
  groupId: string,
  callback: (rows: ListItemRow[]) => void
): () => void {
  let current: ListItemRow[] = [];

  getListItems(groupId).then((rows) => {
    current = rows;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`list_items:${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "list_items", filter: `group_id=eq.${groupId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as ListItemRow;
          if (!["active", "gifted"].includes(row.status)) return;
          current = [...current, row];
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as ListItemRow;
          if (row.status === "archived") {
            current = current.filter((r) => r.id !== row.id);
          } else {
            current = current.map((r) => (r.id === row.id ? row : r));
          }
        } else if (payload.eventType === "DELETE") {
          current = current.filter((r) => r.id !== (payload.old as Partial<ListItemRow>).id);
        }
        callback(current);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpenses(
  groupId: string,
  userId: string
): Promise<ExpenseRow[]> {
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  return (data ?? []).filter(
    (e) =>
      e.paid_by === userId ||
      (e.splits as ExpenseRow["splits"]).some((s) => s.user_id === userId)
  );
}

export async function addExpense(data: Omit<ExpenseRow, "id" | "created_at">) {
  await supabase.from("expenses").insert(data);
}

export async function addSettlement(
  data: Omit<SettlementRow, "id" | "settled_at">
) {
  await supabase.from("settlements").insert(data);
}

export function subscribeExpenses(
  groupId: string,
  userId: string,
  callback: (rows: ExpenseRow[]) => void
): () => void {
  let current: ExpenseRow[] = [];

  getExpenses(groupId, userId).then((rows) => {
    current = rows;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`expenses:${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` },
      () => {
        // Re-fetch — splits are JSONB so we re-filter server-side
        getExpenses(groupId, userId).then((rows) => {
          current = rows;
          callback(current);
        });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── Saving pots ───────────────────────────────────────────────────────────────

export async function getSavingPots(
  groupId: string,
  userId: string
): Promise<SavingPotRow[]> {
  const { data } = await supabase
    .from("saving_pots")
    .select("*")
    .eq("group_id", groupId);
  return (data ?? []).filter((p) => p.viewers?.includes(userId));
}

export async function addSavingPot(
  data: Omit<SavingPotRow, "id" | "created_at">
) {
  await supabase.from("saving_pots").insert(data);
}

export function subscribeSavingPots(
  groupId: string,
  userId: string,
  callback: (rows: SavingPotRow[]) => void
): () => void {
  let current: SavingPotRow[] = [];

  getSavingPots(groupId, userId).then((rows) => {
    current = rows;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`saving_pots:${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "saving_pots", filter: `group_id=eq.${groupId}` },
      () => {
        getSavingPots(groupId, userId).then((rows) => {
          current = rows;
          callback(current);
        });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── Pot contributions ─────────────────────────────────────────────────────────

export async function getPotContributions(
  potId: string
): Promise<PotContributionRow[]> {
  const { data } = await supabase
    .from("pot_contributions")
    .select("*")
    .eq("pot_id", potId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function addPotContribution(
  data: Omit<PotContributionRow, "id" | "created_at">
) {
  await supabase.from("pot_contributions").insert(data);
}

export function subscribePotContributions(
  potId: string,
  callback: (rows: PotContributionRow[]) => void
): () => void {
  let current: PotContributionRow[] = [];

  getPotContributions(potId).then((rows) => {
    current = rows;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`pot_contributions:${potId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pot_contributions", filter: `pot_id=eq.${potId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          current = [payload.new as PotContributionRow, ...current];
        }
        callback(current);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── Group members with profiles ───────────────────────────────────────────────

export interface MemberWithProfile extends GroupMemberRow {
  profile: UserRow | null;
}

export async function getGroupMembersWithProfiles(
  groupId: string
): Promise<MemberWithProfile[]> {
  const members = await getGroupMembers(groupId);
  const userIds = members.map((m) => m.user_id);
  const profiles = await getUsers(userIds);
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
  return members.map((m) => ({ ...m, profile: profileMap[m.user_id] ?? null }));
}

export function subscribeGroupMembers(
  groupId: string,
  callback: (members: MemberWithProfile[]) => void
): () => void {
  let current: MemberWithProfile[] = [];

  getGroupMembersWithProfiles(groupId).then((members) => {
    current = members;
    callback(current);
  });

  const channel: RealtimeChannel = supabase
    .channel(`group_members:${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
      () => {
        getGroupMembersWithProfiles(groupId).then((members) => {
          current = members;
          callback(current);
        });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
