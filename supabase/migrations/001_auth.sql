create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  mobile text,
  email text,
  device_id text,
  created_at timestamptz default now()
);
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  chassis_no text,
  model text,
  dl_no text
);
alter table profiles enable row level security;
alter table vehicles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own vehicle" on vehicles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
