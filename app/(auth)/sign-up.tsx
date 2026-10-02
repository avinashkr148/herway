import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, H } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { saveProfile } from '@/features/auth/api';

export default function SignUp() {
  const [f, setF] = useState({ name: '', email: '', chassisNo: '', model: '', dlNo: '' });
  const router = useRouter();
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const save = async () => {
    if (!f.name) return Alert.alert('Please enter your name');
    try { await saveProfile(f); router.replace('/'); } catch (e: any) { Alert.alert('Error', e.message); }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 72, backgroundColor: theme.bg }}>
      <H>Complete your profile</H>
      <Input placeholder="Full name" value={f.name} onChangeText={set('name')} />
      <Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={f.email} onChangeText={set('email')} />
      <Input placeholder="Vehicle model (optional)" value={f.model} onChangeText={set('model')} />
      <Input placeholder="Chassis no. (optional)" value={f.chassisNo} onChangeText={set('chassisNo')} />
      <Input placeholder="Driving licence no. (optional)" autoCapitalize="characters" value={f.dlNo} onChangeText={set('dlNo')} />
      <Button title="Save and continue" onPress={save} />
    </ScrollView>
  );
}
