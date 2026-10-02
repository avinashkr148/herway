-- Community photos are published immediately in the current product flow.
-- Keep the status column for future reporting/moderation tools.
alter table trip_feedback_photos alter column status set default 'approved';
update trip_feedback_photos set status = 'approved' where status = 'pending';
