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
  btn: { padding: 14, borderRadius: 12, alignItems: 'center', marginVertical: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, marginVertical: 6, backgroundColor: '#fff', color: theme.text },
  card: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: theme.border },
  h: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
});
// this is for test 