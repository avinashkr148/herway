import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, Input, H } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { addContact, callPolice, listContacts, removeContact, triggerSos } from '@/features/sos/api';

export default function Sos() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const refresh = async () => setContacts(await listContacts());
  useFocusEffect(useCallback(() => { refresh(); }, []));
  useEffect(() => () => { if (holdTimer.current) clearInterval(holdTimer.current); }, []);

  const sos = async () => {
    setSending(true);
    try {
      const r = await triggerSos();
      Alert.alert(r.delivery === 'server' ? 'SOS sent' : 'SOS ready', r.count ? (r.delivery === 'server' ? `SMS sent to ${r.count} trusted contact(s).` : `Review and send the message to ${r.count} trusted contact(s).`) : 'Add trusted contacts below so they can be alerted.');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSending(false); setHoldProgress(0); }
  };
  const cancelHold = () => { if (holdTimer.current) clearInterval(holdTimer.current); holdTimer.current = null; if (!sending) setHoldProgress(0); };
  const startHold = () => {
    if (sending || holdTimer.current) return;
    const startedAt = Date.now();
    holdTimer.current = setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / 2000, 1);
      setHoldProgress(progress);
      if (progress === 1) { cancelHold(); void sos(); }
    }, 40);
  };
  const add = async () => {
    if (!name || !phone) return;
    await addContact(name, phone); setName(''); setPhone(''); refresh();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: theme.bg, flexGrow: 1 }}>
      <View style={{ marginBottom: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Hold for two seconds to send SOS" onPressIn={startHold} onPressOut={cancelHold} disabled={sending} style={{ minHeight: 176, overflow: 'hidden', borderRadius: 24, backgroundColor: theme.danger, justifyContent: 'center', alignItems: 'center', opacity: sending ? 0.7 : 1 }}>
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${holdProgress * 100}%`, backgroundColor: '#991B1B' }} />
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: 1 }}>SOS</Text>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 8 }}>{sending ? 'Sending alert…' : holdProgress ? `Keep holding… ${Math.ceil((1 - holdProgress) * 2)}s` : 'Hold for 2 seconds to alert contacts'}</Text>
          <Text style={{ color: '#FEE2E2', marginTop: 8 }}>Shares your current location</Text>
        </Pressable>
        <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 8, fontSize: 12 }}>Designed to reduce accidental alerts. Release before two seconds to cancel.</Text>
      </View>
      <Button title="Call police (112)" danger onPress={callPolice} />
      <Card>
        <H>Trusted contacts</H>
        {contacts.map((c) => (
          <Pressable key={c.id} onLongPress={async () => { await removeContact(c.id); refresh(); }}>
            <Text style={{ paddingVertical: 4 }}>{c.name}: {c.phone}</Text>
          </Pressable>
        ))}
        <Text style={{ color: theme.muted, fontSize: 12 }}>Long-press a contact to remove</Text>
        <Input placeholder="Name" value={name} onChangeText={setName} />
        <Input placeholder="Phone (with country code)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Button title="Add contact" onPress={add} />
      </Card>
    </ScrollView>
  );
}
