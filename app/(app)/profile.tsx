import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Card, H } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { getProfile, signOut } from '@/features/auth/api';

export default function Profile() {
  const [p, setP] = useState<any>(null);
  const router = useRouter();
  useEffect(() => { getProfile().then(setP); }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: theme.bg, flexGrow: 1 }}>
      <Card>
        <H>{p?.name ?? 'Profile'}</H>
        <Text>Mobile: {p?.mobile}</Text><Text>Email: {p?.email}</Text><Text>Device ID: {p?.device_id}</Text>
        {p?.vehicles?.[0] && <Text>Vehicle: {p.vehicles[0].model}</Text>}
      </Card>
      <Pressable accessibilityRole="button" onPress={() => router.push('/community')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderRadius: 16, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: theme.border }}>
        <View><Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Community road insights</Text><Text style={{ color: theme.muted, marginTop: 3 }}>View shared road, lighting, and safety feedback</Text></View>
        <Ionicons name="chevron-forward" size={22} color={theme.primary} />
      </Pressable>
      <Button title="Sign out" onPress={async () => { await signOut(); router.replace('/sign-in'); }} />
    </ScrollView>
  );
}
