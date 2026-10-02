import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card, H } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { deleteTripFeedback, getCommunityFeedback } from '@/features/community/api';

const label = (value: number, labels: string[]) => labels[value - 1];

export default function Community() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { setItems(await getCommunityFeedback()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const confirmDelete = (id: string) => Alert.alert('Delete this post?', 'This will permanently remove your feedback and any attached photos.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await deleteTripFeedback(id);
        setItems((current) => current.filter((item) => item.id !== id));
      } catch (error: any) {
        Alert.alert('Could not delete post', error.message);
      }
    } },
  ]);
  const safety = items.length ? Math.round((items.reduce((total, item) => total + item.women_safety, 0) / items.length) / 3 * 100) : null;
  return <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: theme.bg, flexGrow: 1 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); load(); }} />}>
    <H>Community road insights</H>
    <Text style={{ color: theme.muted, marginBottom: 8 }}>Anonymous reports from completed trips. They are guidance, not a guarantee of safety.</Text>
    <Card><Text style={{ fontSize: 26, fontWeight: '800', color: theme.primary }}>{safety === null ? 'No reports yet' : `${safety}% community safety score`}</Text><Text style={{ color: theme.muted }}>{items.length ? `Based on ${items.length} recent completed trip${items.length === 1 ? '' : 's'}` : 'Complete a trip and share the first report.'}</Text></Card>
    {loading && !items.length ? <ActivityIndicator /> : items.map((item) => <Card key={item.id}>
      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{item.destination}</Text>
      <Text style={{ color: theme.muted, marginTop: 4 }}>Road: {label(item.road_condition, ['Poor', 'Okay', 'Good'])} · Lighting: {label(item.lighting, ['Poor', 'Partial', 'Well lit'])}</Text>
      <Text style={{ color: theme.muted }}>Felt safe driving: {label(item.women_safety, ['No', 'Somewhat', 'Yes'])}</Text>
      {!!item.concerns?.length && <Text style={{ color: theme.muted, marginTop: 4 }}>Noted: {item.concerns.join(', ')}</Text>}
      {!!item.description && <Text style={{ color: theme.text, marginTop: 8 }}>{item.description}</Text>}
      {!!item.photoUrls?.length && <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>{item.photoUrls.map((uri: string) => <Image key={uri} source={{ uri }} style={{ width: 96, height: 96, borderRadius: 10 }} />)}</View>}
      {item.canDelete && <Pressable onPress={() => confirmDelete(item.id)} style={{ alignSelf: 'flex-start', marginTop: 12, paddingVertical: 6 }}><Text style={{ color: '#b42318', fontWeight: '700' }}>Delete my post</Text></Pressable>}
    </Card>)}
  </ScrollView>;
}
