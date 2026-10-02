insert into storage.buckets (id, name, public)
values ('vehicle-maintenance-bills', 'vehicle-maintenance-bills', false)
on conflict (id) do nothing;

create table vehicle_maintenance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_date date not null,
  interval_months integer not null check (interval_months between 1 and 60),
  service_type text not null default 'Routine service',
  parts text[] not null default '{}',
  cost numeric(12, 2) check (cost is null or cost >= 0),
  notes text check (char_length(notes) <= 1200),
  created_at timestamptz not null default now()
);

create table vehicle_maintenance_documents (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references vehicle_maintenance_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create index vehicle_maintenance_records_vehicle_date_idx on vehicle_maintenance_records(vehicle_id, service_date desc);
create index vehicle_maintenance_documents_record_idx on vehicle_maintenance_documents(record_id);

alter table vehicle_maintenance_records enable row level security;
alter table vehicle_maintenance_documents enable row level security;

create policy "own maintenance records" on vehicle_maintenance_records for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own maintenance documents" on vehicle_maintenance_documents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "manage own maintenance bills" on storage.objects for all to authenticated
  using (bucket_id = 'vehicle-maintenance-bills' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'vehicle-maintenance-bills' and (storage.foldername(name))[1] = auth.uid()::text);
