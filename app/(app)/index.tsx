import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Button, Card, Input, H } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { startTrip, endTrip } from '@/features/trip-sharing/api';
import TripFeedbackForm from '@/features/community/TripFeedbackForm';
import { submitTripFeedback } from '@/features/community/api';
import { DestinationSuggestion, searchDestinations } from '@/features/trip-sharing/destinations';

export default function Home() {
  const [dest, setDest] = useState('');
  const [origin, setOrigin] = useState('');
  const [locatingOrigin, setLocatingOrigin] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<DestinationSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [searchingDestination, setSearchingDestination] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [completedTrip, setCompletedTrip] = useState<{ id: string; destination: string | null } | null>(null);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedDestination || dest.trim().length < 3 || link || completedTrip) {
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingDestination(true);
      try { setSuggestions(await searchDestinations(dest.trim())); }
      catch (error: any) { Alert.alert('Location search', error.message); }
      finally { setSearchingDestination(false); }
    }, 700);
    return () => clearTimeout(timer);
  }, [dest, selectedDestination, link, completedTrip]);

  const start = async () => {
    if (!origin.trim()) return Alert.alert('Add a starting location', 'Enter your start point or use your current location.');
    if (!selectedDestination) return Alert.alert('Select a destination', 'Choose a location from the search results before starting your trip.');
    setStarting(true);
    try {
      const t = await startTrip(origin, selectedDestination.label);
      setLink(t.link);
    } catch (e: any) { Alert.alert('Could not start trip', e.message); }
    finally { setStarting(false); }
  };
  const useCurrentLocation = async () => {
    setLocatingOrigin(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Allow location access to use your current location.');
      if (Platform.OS !== 'web') await Location.requestBackgroundPermissionsAsync();
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      const label = address ? [address.name, address.street, address.city, address.region].filter(Boolean).join(', ') : `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
      setOrigin(label);
    } catch (error: any) { Alert.alert('Current location', error.message); }
    finally { setLocatingOrigin(false); }
  };
  const shareTrip = async () => {
    if (!link) return;
    await Share.share({ title: 'HerWay live trip', message: `I’m travelling from ${origin} to ${selectedDestination?.label ?? dest}. Follow my live trip here: ${link}` });
  };
  const end = async () => {
    setEnding(true);
    try {
      const trip = await endTrip();
      setLink(null);
      if (trip) setCompletedTrip(trip);
    } catch (e: any) { Alert.alert('Could not end trip', e.message); }
    finally { setEnding(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: theme.bg, flexGrow: 1 }}>
      <Card>
        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>PLAN A SAFE RIDE</Text>
        <H>Plan your trip</H>
        <Text style={{ color: theme.text, fontWeight: '800', marginTop: 6 }}>Starting location</Text>
        <Input placeholder="Enter your start point" value={origin} onChangeText={setOrigin} editable={!link && !completedTrip} />
        {!link && !completedTrip && <Pressable onPress={useCurrentLocation} disabled={locatingOrigin} style={{ alignSelf: 'flex-start', paddingVertical: 5 }}><Text style={{ color: theme.primary, fontWeight: '800' }}><Ionicons name="locate" size={15} /> {locatingOrigin ? 'Finding your location…' : 'Use my current location'}</Text></Pressable>}
        <Text style={{ color: theme.text, fontWeight: '800', marginTop: 10 }}>Final destination</Text>
        <Input placeholder="Search your destination, e.g. HSR Layout, Bengaluru" value={dest} onChangeText={(value) => { setDest(value); setSelectedDestination(null); setSuggestions([]); }} editable={!link && !completedTrip} />
        {searchingDestination && <ActivityIndicator accessibilityLabel="Searching locations" style={{ marginVertical: 6 }} />}
        {!!suggestions.length && <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' }}>
          {suggestions.map((place) => <Pressable key={place.id} onPress={() => { setSelectedDestination(place); setDest(place.label); setSuggestions([]); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}><Text style={{ color: theme.text }}>{place.label}</Text></Pressable>)}
        </View>}
        <Text style={{ color: theme.muted, marginTop: 8 }}>{selectedDestination ? `Trip: ${origin || 'Start location'} → ${selectedDestination.label}` : 'Search and select your final destination before starting.'}</Text>
        {!link && !completedTrip && <Button title={starting ? 'Starting trip…' : 'Plan & start live trip'} onPress={start} disabled={starting} />}
      </Card>
      <View style={{ backgroundColor: '#2D1B69', borderRadius: 22, padding: 18, marginVertical: 10, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#4C2D9B', right: -48, top: -58 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#A78BFA', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="shield-checkmark" size={21} color="#2D1B69" /></View><Text style={{ color: '#EDE9FE', fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>BEFORE YOU GO</Text></View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 14 }}>Your ride, your rules.</Text>
        <Text style={{ color: '#DDD6FE', lineHeight: 20, marginTop: 6 }}>Take one minute to gear up, charge your phone, and let someone you trust know where you are headed.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
          {['Helmet / seat belt', 'Phone charged', 'Vehicle checked'].map((item) => <View key={item} style={{ borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#49308D' }}><Text style={{ color: '#F5F3FF', fontSize: 12, fontWeight: '700' }}>{item}</Text></View>)}
        </View>
      </View>
      {!!link && <Card>
        <H>Live trip sharing</H>
        <Text style={{ color: theme.muted }}>From</Text><Text style={{ color: theme.text, fontWeight: '700' }}>{origin}</Text><Text style={{ color: theme.muted, marginTop: 8 }}>To</Text><Text style={{ color: theme.text, fontWeight: '700' }}>{selectedDestination?.label ?? dest}</Text>
        <Text selectable style={{ color: theme.primary, marginTop: 12 }}>{link}</Text><Text style={{ color: theme.muted, marginTop: 5 }}>You choose when and who to share this live link with.</Text><Button title="Share live trip" onPress={shareTrip} /><Button title={ending ? 'Ending trip…' : 'End trip'} danger onPress={end} disabled={ending} />
      </Card>}
      {!!completedTrip && <TripFeedbackForm destination={completedTrip.destination} onSkip={() => setCompletedTrip(null)} onSubmit={async (answers, photoUris) => { await submitTripFeedback(completedTrip, answers, photoUris); setCompletedTrip(null); router.push('/community'); }} />}
    </ScrollView>
  );
}
