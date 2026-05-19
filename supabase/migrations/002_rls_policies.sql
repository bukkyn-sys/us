-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.mood_checkins enable row level security;
alter table public.group_notes enable row level security;
alter table public.countdowns enable row level security;
alter table public.availability enable row level security;
alter table public.list_folders enable row level security;
alter table public.list_items enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;
alter table public.saving_pots enable row level security;
alter table public.pot_contributions enable row level security;

-- Helper: is the current user a member of a given group?
create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- ── Users ──────────────────────────────────────────────────────────────────────
-- Anyone can read a user profile (needed to render member names/avatars)
create policy "users_select" on public.users
  for select using (true);

-- Users can only write their own profile
create policy "users_insert" on public.users
  for insert with check (id = auth.uid());

create policy "users_update" on public.users
  for update using (id = auth.uid());

-- ── Groups ─────────────────────────────────────────────────────────────────────
create policy "groups_select" on public.groups
  for select using (public.is_group_member(id));

create policy "groups_insert" on public.groups
  for insert with check (created_by = auth.uid());

-- ── Group members ──────────────────────────────────────────────────────────────
create policy "group_members_select" on public.group_members
  for select using (public.is_group_member(group_id));

create policy "group_members_insert" on public.group_members
  for insert with check (user_id = auth.uid());

-- ── Mood check-ins ─────────────────────────────────────────────────────────────
create policy "mood_checkins_select" on public.mood_checkins
  for select using (public.is_group_member(group_id));

create policy "mood_checkins_insert" on public.mood_checkins
  for insert with check (user_id = auth.uid() and public.is_group_member(group_id));

create policy "mood_checkins_update" on public.mood_checkins
  for update using (user_id = auth.uid());

create policy "mood_checkins_delete" on public.mood_checkins
  for delete using (user_id = auth.uid());

-- ── Group notes ────────────────────────────────────────────────────────────────
create policy "group_notes_select" on public.group_notes
  for select using (public.is_group_member(group_id));

create policy "group_notes_upsert" on public.group_notes
  for insert with check (public.is_group_member(group_id));

create policy "group_notes_update" on public.group_notes
  for update using (public.is_group_member(group_id));

-- ── Countdowns ─────────────────────────────────────────────────────────────────
create policy "countdowns_select" on public.countdowns
  for select using (public.is_group_member(group_id));

create policy "countdowns_insert" on public.countdowns
  for insert with check (created_by = auth.uid() and public.is_group_member(group_id));

create policy "countdowns_update" on public.countdowns
  for update using (public.is_group_member(group_id));

-- ── Availability ───────────────────────────────────────────────────────────────
create policy "availability_select" on public.availability
  for select using (public.is_group_member(group_id));

create policy "availability_insert" on public.availability
  for insert with check (user_id = auth.uid() and public.is_group_member(group_id));

create policy "availability_update" on public.availability
  for update using (user_id = auth.uid());

create policy "availability_delete" on public.availability
  for delete using (user_id = auth.uid());

-- ── List folders ───────────────────────────────────────────────────────────────
create policy "list_folders_select" on public.list_folders
  for select using (public.is_group_member(group_id));

create policy "list_folders_insert" on public.list_folders
  for insert with check (created_by = auth.uid() and public.is_group_member(group_id));

create policy "list_folders_update" on public.list_folders
  for update using (public.is_group_member(group_id));

-- ── List items ─────────────────────────────────────────────────────────────────
create policy "list_items_select" on public.list_items
  for select using (public.is_group_member(group_id));

create policy "list_items_insert" on public.list_items
  for insert with check (created_by = auth.uid() and public.is_group_member(group_id));

create policy "list_items_update" on public.list_items
  for update using (public.is_group_member(group_id));

-- ── Expenses ───────────────────────────────────────────────────────────────────
create policy "expenses_select" on public.expenses
  for select using (public.is_group_member(group_id));

create policy "expenses_insert" on public.expenses
  for insert with check (created_by = auth.uid() and public.is_group_member(group_id));

-- ── Settlements ────────────────────────────────────────────────────────────────
create policy "settlements_select" on public.settlements
  for select using (debtor_id = auth.uid() or creditor_id = auth.uid());

create policy "settlements_insert" on public.settlements
  for insert with check (debtor_id = auth.uid());

-- ── Saving pots ────────────────────────────────────────────────────────────────
create policy "saving_pots_select" on public.saving_pots
  for select using (public.is_group_member(group_id));

create policy "saving_pots_insert" on public.saving_pots
  for insert with check (created_by = auth.uid() and public.is_group_member(group_id));

-- ── Pot contributions ──────────────────────────────────────────────────────────
create policy "pot_contributions_select" on public.pot_contributions
  for select using (
    exists (
      select 1 from public.saving_pots sp
      where sp.id = pot_id and public.is_group_member(sp.group_id)
    )
  );

create policy "pot_contributions_insert" on public.pot_contributions
  for insert with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.saving_pots sp
      where sp.id = pot_id and auth.uid() = any(sp.contributors)
    )
  );
