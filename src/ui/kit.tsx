import { Pressable, Text, TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { theme } from './theme';

export function Button({ title, onPress, danger, disabled }: { title: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={[s.btn, { backgroundColor: danger ? theme.danger : theme.primary }, disabled && { opacity: 0.5 }]}>
      <Text style={s.btnText}>{title}</Text>
    </Pressable>
  );
}
export const Input = (p: TextInputProps) => <TextInput placeholderTextColor={theme.muted} {...p} style={[s.input, p.style]} />;
export const Card = ({ children }: { children: React.ReactNode }) => <View style={s.card}>{children}</View>;
export const H = ({ children }: { children: React.ReactNode }) => <Text style={s.h}>{children}</Text>;

const s = StyleSheet.create({
  btn: { padding: 15, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginVertical: 6, shadowColor: '#4C1D95', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 13, marginVertical: 6, backgroundColor: '#fff', color: theme.text },
  card: { backgroundColor: theme.card, borderRadius: 20, padding: 17, marginVertical: 8, borderWidth: 1, borderColor: '#EEE9F7', shadowColor: '#2D1B69', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 1 },
  h: { fontSize: 21, fontWeight: '800', color: theme.text, marginBottom: 8, letterSpacing: -0.2 },
});
// this is for test
