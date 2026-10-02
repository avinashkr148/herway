import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { supabase } from '@/core/supabase';

export const listContacts = async () =>
  (await supabase.from('contacts').select('*').order('created_at')).data ?? [];

export async function addContact(name: string, phone: string) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from('contacts').insert({ user_id: user!.id, name, phone });
}
export const removeContact = (id: string) => supabase.from('contacts').delete().eq('id', id);

export const callPolice = () => Linking.openURL('tel:112'); // India emergency number

export async function triggerSos() {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') throw new Error('Location permission needed for SOS');
  const pos = await Location.getCurrentPositionAsync({});
  const { latitude: lat, longitude: lng } = pos.coords;
  const msg = `SOS! I need help. My live location: https://maps.google.com/?q=${lat},${lng}`;

  const { data: { user } } = await supabase.auth.getUser();
  const { error: eventError } = await supabase.from('sos_events').insert({ user_id: user!.id, lat, lng });
  if (eventError) throw eventError;

  const contacts = await listContacts();
  const phones = contacts.map((c: any) => c.phone);
  if (!phones.length) return { msg, count: 0, delivery: 'none' as const };

  const { data, error: functionError } = await supabase.functions.invoke('send-sos', { body: { lat, lng } });
  if (!functionError) return { msg, count: data?.sent ?? phones.length, delivery: 'server' as const };

  if (Platform.OS !== 'web' && (await SMS.isAvailableAsync())) {
    await SMS.sendSMSAsync(phones, msg);
    return { msg, count: phones.length, delivery: 'device' as const };
  }
  throw new Error('SOS SMS delivery is not configured. Deploy the send-sos function with Twilio credentials, or use a physical phone to open the SMS composer.');
}
