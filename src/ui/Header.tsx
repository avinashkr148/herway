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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: theme.border }}>
      <Text style={{ color: theme.text, fontWeight: '700' }}>Device ID: {id}</Text>
      <Pressable onPress={() => router.push('/profile')}><Ionicons name="person-circle" size={32} color={theme.primary} /></Pressable>
    </View>
  );
}
