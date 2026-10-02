import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/core/supabase';
import { storage } from '@/core/storage';
import { TRIP_TASK } from './task';

let webWatcher: Location.LocationSubscription | null = null;

export const trackingLink = (token: string) => `${process.env.EXPO_PUBLIC_TRACKER_URL}/?t=${token}`;

export async function startTrip(origin?: string, destination?: string) {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('Location permission needed');
  if (Platform.OS !== 'web') await Location.requestBackgroundPermissionsAsync();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: trip, error } = await supabase.from('trips')
    .insert({ user_id: user!.id, origin: origin?.trim() || null, destination: destination?.trim() || null }).select().single();
  if (error) throw error;
  await storage.setItem('active_trip_id', trip.id);

  if (Platform.OS === 'web') {
    webWatcher = await Location.watchPositionAsync({ distanceInterval: 20, timeInterval: 10000 }, (l) =>
      supabase.from('locations').insert({ trip_id: trip.id, lat: l.coords.latitude, lng: l.coords.longitude }));
  } else {
    await Location.startLocationUpdatesAsync(TRIP_TASK, {
      accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20,
      foregroundService: { notificationTitle: 'HerWay trip in progress', notificationBody: 'Sharing your location with trusted contacts' },
    });
  }
  return { id: trip.id as string, link: trackingLink(trip.share_token) };
}

export async function endTrip() {
  const id = await storage.getItem('active_trip_id');
  if (Platform.OS === 'web') webWatcher?.remove();
  else if (await Location.hasStartedLocationUpdatesAsync(TRIP_TASK)) await Location.stopLocationUpdatesAsync(TRIP_TASK);
  let trip: { id: string; destination: string | null } | null = null;
  if (id) {
    const { data, error } = await supabase.from('trips')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, destination')
      .single();
    if (error) throw error;
    trip = data;
  }
  await storage.removeItem('active_trip_id');
  return trip;
}
