import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, Text } from 'react-native';
import { Button, Card } from '@/ui/kit';
import { findNearby, PlaceKind } from './api';

export default function PlaceList({ kind }: { kind: PlaceKind }) {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { setPlaces(await findNearby(kind)); } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };
  return (
    <>
      <Button title={loading ? 'Finding nearby places…' : 'Search near me'} onPress={load} disabled={loading} />
      {loading && <ActivityIndicator accessibilityLabel="Searching for nearby places" />}
      <FlatList data={places} keyExtractor={(p) => p.id} renderItem={({ item }) => (
        <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`)}>
          <Card><Text style={{ fontWeight: '700' }}>{item.name}</Text><Text>Tap to open in Maps</Text></Card>
        </Pressable>
      )} />
    </>
  );
}
