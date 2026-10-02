import * as Location from 'expo-location';

export type PlaceKind = 'fuel' | 'parking' | 'ev' | 'repair';
const TAGS: Record<PlaceKind, string> = {
  fuel: '["amenity"="fuel"]', parking: '["amenity"="parking"]',
  ev: '["amenity"="charging_station"]', repair: '["shop"="car_repair"]',
};

// Free OpenStreetMap Overpass API: no key needed.
export async function findNearby(kind: PlaceKind, radius = 3000) {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') throw new Error('Location permission needed');
  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000, requiredAccuracy: 1000 });
  const { coords } = lastKnown ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const q = `[out:json][timeout:20];nwr(around:${radius},${coords.latitude},${coords.longitude})${TAGS[kind]};out center 20;`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('Search timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error('Nearby places are temporarily unavailable. Please try again.');
  const json = await res.json();
  return json.elements.map((e: any) => ({
    id: String(e.id),
    name: e.tags?.name ?? e.tags?.operator ?? 'Unnamed',
    lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon,
  })).filter((p: any) => p.lat && p.lng);
}
