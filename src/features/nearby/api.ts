import * as Location from 'expo-location';

export type PlaceKind = 'fuel' | 'parking' | 'ev' | 'repair';
const TAGS: Record<PlaceKind, string> = {
  fuel: '["amenity"="fuel"]', parking: '["amenity"="parking"]',
  ev: '["amenity"="charging_station"]', repair: '["shop"="car_repair"]',
};
const cache = new Map<string, { expiresAt: number; places: any[] }>();
const MAX_RESULTS = 25;

// Free OpenStreetMap Overpass API: no key needed.
export async function findNearby(kind: PlaceKind, radius = 3000) {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') throw new Error('Location permission needed');
  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000, requiredAccuracy: 1000 });
  const { coords } = lastKnown ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const cacheKey = `${kind}:${coords.latitude.toFixed(2)}:${coords.longitude.toFixed(2)}:${radius}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.places;
  // Relations are expensive and are not useful for a compact nearby list. A lower
  // server timeout and result cap keep dense parking searches responsive.
  const q = `[out:json][timeout:8];(node(around:${radius},${coords.latitude},${coords.longitude})${TAGS[kind]};way(around:${radius},${coords.latitude},${coords.longitude})${TAGS[kind]};);out center ${MAX_RESULTS};`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
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
  const places = json.elements.map((e: any) => ({
    id: String(e.id),
    name: e.tags?.name ?? e.tags?.operator ?? 'Unnamed',
    lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon,
  })).filter((p: any) => p.lat && p.lng);
  cache.set(cacheKey, { places, expiresAt: Date.now() + 2 * 60 * 1000 });
  return places;
}
