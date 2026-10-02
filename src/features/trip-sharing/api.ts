import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/core/supabase';
import { storage } from '@/core/storage';
import { TRIP_TASK } from './task';

let webWatcher: Location.LocationSubscription | null = null;

export const trackingLink = (token: string) => `${process.env.EXPO_PUBLIC_TRACKER_URL}/?t=${token}`;

async function within<T>(promise: PromiseLike<T>, action: string, timeoutMs = 12_000) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race<T>([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error(`${action} timed out. Check your connection and try again.`)), timeoutMs); }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function startTrip(origin?: string, destination?: string) {
  const fg = await within(Location.requestForegroundPermissionsAsync(), 'Location permission request');
  if (fg.status !== 'granted') throw new Error('Location permission needed');
  if (Platform.OS !== 'web') await within(Location.requestBackgroundPermissionsAsync(), 'Background location permission request');

  const { data: { user } } = await within(supabase.auth.getUser(), 'Sign-in check');
  if (!user) throw new Error('Your sign-in session has expired. Please sign in again.');
  const { data: trip, error } = await within(supabase.from('trips')
    .insert({ user_id: user.id, origin: origin?.trim() || null, destination: destination?.trim() || null }).select().single(), 'Creating the trip');
  if (error) throw error;
  await storage.setItem('active_trip_id', trip.id);

  if (Platform.OS === 'web') {
    // Browser geolocation may wait a long time for its first accurate fix. Do not
    // block the trip UI (or its End trip action) while that happens.
    void Location.watchPositionAsync({ distanceInterval: 20, timeInterval: 10000 }, (l) =>
      supabase.from('locations').insert({ trip_id: trip.id, lat: l.coords.latitude, lng: l.coords.longitude }))
      .then(async (subscription) => {
        // The user may have ended the trip before the browser delivered its first fix.
        if (await storage.getItem('active_trip_id') !== trip.id) subscription.remove();
        else webWatcher = subscription;
      })
      .catch((error) => console.warn('Unable to start web location tracking', error));
  } else {
    await Location.startLocationUpdatesAsync(TRIP_TASK, {
      accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20,
      foregroundService: { notificationTitle: 'HerWay trip in progress', notificationBody: 'Sharing your location with trusted contacts' },
    });
  }
  return { id: trip.id as string, link: trackingLink(trip.share_token) };
}

export async function getActiveTrip() {
  const id = await storage.getItem('active_trip_id');
  if (!id) return null;
  const { data: trip, error } = await supabase.from('trips')
    .select('id, origin, destination, share_token, status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!trip || trip.status !== 'active') {
    await storage.removeItem('active_trip_id');
    return null;
  }
  return { id: trip.id as string, origin: trip.origin as string | null, destination: trip.destination as string | null, link: trackingLink(trip.share_token) };
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
