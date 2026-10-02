import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, H } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { sendOtp, verifyOtp, hasProfile } from '@/features/auth/api';

export default function SignIn() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const send = async () => {
    if (mobile.replace(/\D/g, '').length !== 10) return Alert.alert('Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      const { error } = await sendOtp(mobile);
      if (error) Alert.alert('Error', error.message);
      else setSent(true);
    } finally { setLoading(false); }
  };
  const verify = async () => {
    if (!otp.trim()) return Alert.alert('Enter the OTP');
    setLoading(true);
    try {
      const { error } = await verifyOtp(mobile, otp);
      if (error) return Alert.alert('Error', error.message);
      router.replace((await hasProfile()) ? '/' : '/sign-up'); // new users complete their profile
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 96, backgroundColor: theme.bg, flexGrow: 1 }}>
      <H>HerWay</H>
      <Text style={{ color: theme.muted, marginBottom: 16 }}>Safer, more confident mobility for women. Sign in with your mobile number. New here? We&apos;ll ask for your details after OTP.</Text>
      <Input placeholder="Mobile number" keyboardType="number-pad" maxLength={10} value={mobile} onChangeText={setMobile} editable={!sent} />
      {sent && <Input placeholder="Enter OTP" keyboardType="number-pad" value={otp} onChangeText={setOtp} />}
      <Button title={loading ? (sent ? 'Verifying…' : 'Sending…') : (sent ? 'Verify OTP' : 'Send OTP')} onPress={sent ? verify : send} disabled={loading} />
    </ScrollView>
  );
}
