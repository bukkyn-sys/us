-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Users ──────────────────────────────────────────────────────────────────────
create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  photo_url    text,
  accent_colour text not null default '#C4A882',
  active_group_id uuid,
  created_at   timestamptz not null default now()
);

-- Auto-create user row on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, display_name, photo_url, accent_colour)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    '#C4A882'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Groups ─────────────────────────────────────────────────────────────────────
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('couple', 'group')),
  invite_code text not null unique,
  created_by  uuid not null references public.users(id),
  created_at  timestamptz not null default now()
);

-- ── Group members ──────────────────────────────────────────────────────────────
create table public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  unique (group_id, user_id)
);

-- ── Mood check-ins ─────────────────────────────────────────────────────────────
create table public.mood_checkins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  group_id    uuid not null references public.groups(id) on delete cascade,
  date        date not null,
  emoji_index smallint not null,
  updated_at  timestamptz not null default now(),
  unique (user_id, group_id, date)
);

-- ── Group notes ────────────────────────────────────────────────────────────────
create table public.group_notes (
  group_id   uuid primary key references public.groups(id) on delete cascade,
  text       text not null default '',
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

-- ── Countdowns ─────────────────────────────────────────────────────────────────
create table public.countdowns (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  title      text not null,
  date       date not null,
  emoji      text not null default '🎉',
  created_by uuid not null references public.users(id),
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Availability ───────────────────────────────────────────────────────────────
create table public.availability (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  date     date not null,
  status   text not null check (status in ('free', 'busy')),
  unique (user_id, group_id, date)
);

-- ── List folders ───────────────────────────────────────────────────────────────
create table public.list_folders (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  name        text not null,
  emoji       text not null default '📁',
  hidden_from uuid[] not null default '{}',
  created_by  uuid not null references public.users(id),
  created_at  timestamptz not null default now()
);

-- ── List items ─────────────────────────────────────────────────────────────────
create table public.list_items (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  folder_id   uuid references public.list_folders(id) on delete set null,
  title       text not null,
  url         text,
  og_image    text,
  og_title    text,
  price       numeric(10, 2),
  want_level  smallint not null default 2 check (want_level in (1, 2, 3)),
  created_by  uuid not null references public.users(id),
  status      text not null default 'active' check (status in ('active', 'gifted', 'archived')),
  created_at  timestamptz not null default now()
);

-- ── Expenses ───────────────────────────────────────────────────────────────────
create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  title      text not null,
  total      numeric(10, 2) not null,
  paid_by    uuid not null references public.users(id),
  splits     jsonb not null default '[]',
  date       date not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- ── Settlements ────────────────────────────────────────────────────────────────
create table public.settlements (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references public.expenses(id) on delete cascade,
  debtor_id   uuid not null references public.users(id),
  creditor_id uuid not null references public.users(id),
  settled_at  timestamptz not null default now()
);

-- ── Saving pots ────────────────────────────────────────────────────────────────
create table public.saving_pots (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  folder_id    uuid references public.list_folders(id) on delete set null,
  name         text not null,
  goal_amount  numeric(10, 2),
  viewers      uuid[] not null default '{}',
  contributors uuid[] not null default '{}',
  created_by   uuid not null references public.users(id),
  created_at   timestamptz not null default now()
);

-- ── Pot contributions ──────────────────────────────────────────────────────────
create table public.pot_contributions (
  id         uuid primary key default gen_random_uuid(),
  pot_id     uuid not null references public.saving_pots(id) on delete cascade,
  user_id    uuid not null references public.users(id),
  amount     numeric(10, 2) not null,
  note       text,
  date       date not null,
  created_at timestamptz not null default now()
);

-- ── Realtime ───────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.mood_checkins;
alter publication supabase_realtime add table public.group_notes;
alter publication supabase_realtime add table public.countdowns;
alter publication supabase_realtime add table public.availability;
alter publication supabase_realtime add table public.list_folders;
alter publication supabase_realtime add table public.list_items;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.saving_pots;
alter publication supabase_realtime add table public.pot_contributions;
alter publication supabase_realtime add table public.group_members;
