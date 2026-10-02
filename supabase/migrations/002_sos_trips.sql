create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz default now()
);
create table sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  lat double precision, lng double precision,
  created_at timestamptz default now()
);
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  destination text,
  status text not null default 'active',
  share_token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  started_at timestamptz default now(),
  ended_at timestamptz
);
create table locations (
  id bigint generated always as identity primary key,
  trip_id uuid not null references trips(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  ts timestamptz default now()
);
create index on locations (trip_id, ts desc);

alter table contacts enable row level security;
alter table sos_events enable row level security;
alter table trips enable row level security;
alter table locations enable row level security;

create policy "own contacts" on contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sos" on sos_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trips" on trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own locations" on locations for all
  using (exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()));

-- Public tracking link: anyone with the secret token can read that one trip's latest points, nothing else.
create function get_shared_trip(p_token text)
returns table (lat double precision, lng double precision, ts timestamptz, status text)
language sql security definer set search_path = public as $$
  select l.lat, l.lng, l.ts, t.status
  from trips t join locations l on l.trip_id = t.id
  where t.share_token = p_token
  order by l.ts desc limit 100;
$$;
grant execute on function get_shared_trip(text) to anon, authenticated;
