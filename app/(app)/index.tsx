import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Input, H } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { startTrip, endTrip } from '@/features/trip-sharing/api';
import TripFeedbackForm from '@/features/community/TripFeedbackForm';
import { submitTripFeedback } from '@/features/community/api';
import { DestinationSuggestion, searchDestinations } from '@/features/trip-sharing/destinations';

export default function Home() {
  const [dest, setDest] = useState('');
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
    if (!selectedDestination) return Alert.alert('Select a destination', 'Choose a location from the search results before starting your trip.');
    setStarting(true);
    try {
      const t = await startTrip(selectedDestination.label);
      setLink(t.link);
      await Share.share({ message: `Follow my trip live on HerWay: ${t.link}` });
    } catch (e: any) { Alert.alert('Could not start trip', e.message); }
    finally { setStarting(false); }
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
        <H>Road safety reminder</H>
        <Text style={{ color: theme.text, fontWeight: '700' }}>Wear a helmet on every two-wheeler ride.</Text>
        <Text style={{ color: theme.muted, marginTop: 4 }}>Use a seat belt in cars, avoid driving when tired or distracted, check your vehicle before a long trip, and share your live trip only with people you trust.</Text>
      </Card>
      <Card>
        <H>Plan your trip</H>
        <Input placeholder="Search a destination, e.g. HSR Layout, Bengaluru" value={dest} onChangeText={(value) => { setDest(value); setSelectedDestination(null); setSuggestions([]); }} editable={!link && !completedTrip} />
        {searchingDestination && <ActivityIndicator accessibilityLabel="Searching locations" style={{ marginVertical: 6 }} />}
        {!!suggestions.length && <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' }}>
          {suggestions.map((place) => <Pressable key={place.id} onPress={() => { setSelectedDestination(place); setDest(place.label); setSuggestions([]); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}><Text style={{ color: theme.text }}>{place.label}</Text></Pressable>)}
        </View>}
        <Text style={{ color: theme.muted, marginTop: 8 }}>{selectedDestination ? 'Destination selected. You can start your trip.' : 'Search and select a real destination before starting your trip.'}</Text>
        {!link && !completedTrip && <Button title={starting ? 'Starting trip…' : 'Plan & start live trip'} onPress={start} disabled={starting} />}
      </Card>
      {!!link && <Card>
        <H>Live trip sharing</H>
        <Text selectable>{link}</Text><Button title={ending ? 'Ending trip…' : 'End trip'} danger onPress={end} disabled={ending} />
      </Card>}
      {!!completedTrip && <TripFeedbackForm destination={completedTrip.destination} onSkip={() => setCompletedTrip(null)} onSubmit={async (answers, photoUris) => { await submitTripFeedback(completedTrip, answers, photoUris); setCompletedTrip(null); router.push('/community'); }} />}
    </ScrollView>
  );
}
