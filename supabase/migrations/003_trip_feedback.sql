create table trip_feedback (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references trips(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  destination text not null default 'Community route',
  road_condition smallint not null check (road_condition between 1 and 3),
  lighting smallint not null check (lighting between 1 and 3),
  women_safety smallint not null check (women_safety between 1 and 3),
  concerns text[] not null default '{}',
  description text check (char_length(description) <= 600),
  created_at timestamptz not null default now()
);

create index trip_feedback_created_at_idx on trip_feedback (created_at desc);
alter table trip_feedback enable row level security;

create policy "read community feedback" on trip_feedback for select to authenticated using (true);
create policy "submit own completed trip feedback" on trip_feedback for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from trips where trips.id = trip_id and trips.user_id = auth.uid() and trips.status = 'ended')
);
