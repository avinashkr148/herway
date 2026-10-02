import * as TaskManager from 'expo-task-manager';
import { supabase } from '@/core/supabase';
import { storage } from '@/core/storage';

export const TRIP_TASK = 'HERWAY_TRIP_TRACKING';

// Must be imported once at app start (see app/_layout.tsx).
TaskManager.defineTask(TRIP_TASK, async ({ data, error }: any) => {
  if (error || !data) return;
  const tripId = await storage.getItem('active_trip_id');
  if (!tripId) return;
  const rows = data.locations.map((l: any) => ({
    trip_id: tripId, lat: l.coords.latitude, lng: l.coords.longitude, ts: new Date(l.timestamp).toISOString(),
  }));
  await supabase.from('locations').insert(rows);
});
