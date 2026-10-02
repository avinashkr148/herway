import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import PlaceList from '@/features/nearby/PlaceList';
import { theme } from '@/ui/theme';

const tabs = [['fuel', 'Fuel pump'], ['parking', 'Safe parking'], ['ev', 'EV charging']] as const;

export default function Nearby() {
  const [kind, setKind] = useState<'fuel' | 'parking' | 'ev'>('fuel');
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {tabs.map(([k, label]) => (
          <Pressable key={k} onPress={() => setKind(k)} style={{ padding: 10, borderRadius: 20, backgroundColor: kind === k ? theme.primary : '#fff', borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: kind === k ? '#fff' : theme.text }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <PlaceList key={kind} kind={kind} />
    </View>
  );
}
