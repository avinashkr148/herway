import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
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
      <Button title="Sign out" onPress={async () => { await signOut(); router.replace('/sign-in'); }} />
    </ScrollView>
  );
}
