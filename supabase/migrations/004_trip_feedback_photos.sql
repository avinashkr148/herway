insert into storage.buckets (id, name, public)
values ('trip-feedback-images', 'trip-feedback-images', false)
on conflict (id) do nothing;

create table trip_feedback_photos (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references trip_feedback(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index trip_feedback_photos_feedback_id_idx on trip_feedback_photos (feedback_id);
alter table trip_feedback_photos enable row level security;
create policy "read approved feedback photos" on trip_feedback_photos for select to authenticated using (status = 'approved' or user_id = auth.uid());
create policy "attach own feedback photos" on trip_feedback_photos for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from trip_feedback where trip_feedback.id = feedback_id and trip_feedback.user_id = auth.uid())
);

create policy "upload own feedback photo files" on storage.objects for insert to authenticated with check (
  bucket_id = 'trip-feedback-images' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "read approved feedback photo files" on storage.objects for select to authenticated using (
  bucket_id = 'trip-feedback-images' and ((storage.foldername(name))[1] = auth.uid()::text or exists (select 1 from trip_feedback_photos where trip_feedback_photos.storage_path = name and trip_feedback_photos.status = 'approved'))
);
create policy "delete own feedback photo files" on storage.objects for delete to authenticated using (
  bucket_id = 'trip-feedback-images' and (storage.foldername(name))[1] = auth.uid()::text
);
