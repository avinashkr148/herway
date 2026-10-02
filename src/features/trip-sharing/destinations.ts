export type DestinationSuggestion = { id: string; label: string };

// This public geocoder is suitable for the small, debounced lookup in this app.
// A production launch should move this behind a provider-backed server endpoint.
export async function searchDestinations(query: string): Promise<DestinationSuggestion[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '5', addressdetails: '1' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: 'application/json' }, signal: controller.signal,
    });
    if (!response.ok) throw new Error('Location search is temporarily unavailable.');
    const items = await response.json();
    return items.map((item: any) => ({ id: String(item.place_id), label: item.display_name }));
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('Location search timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
