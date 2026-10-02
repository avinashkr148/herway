alter table vehicle_maintenance_records add column odometer_km integer check (odometer_km is null or odometer_km >= 0);
alter table vehicle_maintenance_records add column interval_km integer check (interval_km is null or interval_km between 1 and 100000);

create table vehicle_telemetry (
  vehicle_id uuid primary key references vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  odometer_km integer not null default 0 check (odometer_km >= 0),
  source text not null default 'demo' check (source in ('demo', 'manual', 'device')),
  updated_at timestamptz not null default now()
);

alter table vehicle_telemetry enable row level security;
create policy "own vehicle telemetry" on vehicle_telemetry for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
