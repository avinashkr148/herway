import { supabase } from '@/core/supabase';
import { getDeviceId } from '@/core/device';

const e164 = (m: string) => '+91' + m.replace(/\D/g, '').slice(-10);

export const sendOtp = (mobile: string) => supabase.auth.signInWithOtp({ phone: e164(mobile) });
export const verifyOtp = (mobile: string, token: string) =>
  supabase.auth.verifyOtp({ phone: e164(mobile), token, type: 'sms' });
export const signOut = () => supabase.auth.signOut();

export async function hasProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  return !!data;
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*, vehicles(*)').eq('id', user.id).maybeSingle();
  return data;
}

export async function saveProfile(p: { name: string; email: string; chassisNo: string; model: string; dlNo: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in first');
  const { error } = await supabase.from('profiles').upsert({
    id: user.id, name: p.name, email: p.email, mobile: user.phone, device_id: await getDeviceId(),
  });
  if (error) throw error;
  const { error: e2 } = await supabase.from('vehicles').insert({
    user_id: user.id, chassis_no: p.chassisNo, model: p.model, dl_no: p.dlNo,
  });
  if (e2) throw e2;
}
