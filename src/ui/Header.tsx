import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDeviceId } from '@/core/device';
import { theme } from './theme';

export default function Header() {
  const [id, setId] = useState('');
  const router = useRouter();
  useEffect(() => { getDeviceId().then(setId); }, []);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 48, paddingHorizontal: 18, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#EEE9F7' }}>
      <View><Text style={{ color: theme.text, fontWeight: '900', fontSize: 18 }}>HerWay</Text><Text style={{ color: theme.muted, fontSize: 11, marginTop: 1 }}>Device ID: {id}</Text></View>
      <Pressable onPress={() => router.push('/profile')} style={{ padding: 2 }}><Ionicons name="person-circle" size={34} color={theme.primary} /></Pressable>
    </View>
  );
}
