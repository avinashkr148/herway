import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

const tabDetails: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Home', icon: 'home' },
  nearby: { label: 'Nearby', icon: 'location' },
  repair: { label: 'Repair', icon: 'construct' },
  maintenance: { label: 'Care', icon: 'car-sport' },
};

export default function AppTabBar({ state, descriptors, navigation }: any) {
  const routes = state.routes.filter((route: any) => route.name !== 'profile' && route.name !== 'community');
  const sos = state.routes.find((route: any) => route.name === 'sos');
  const beforeSos = routes.slice(0, 2).filter((route: any) => route.name !== 'sos');
  const afterSos = routes.slice(2).filter((route: any) => route.name !== 'sos');
  const press = (route: any) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(route.name);
  };
  const regularTab = (route: any) => {
    const focused = state.index === state.routes.findIndex((item: any) => item.key === route.key);
    const detail = tabDetails[route.name];
    if (!detail) return null;
    return <Pressable key={route.key} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}} onPress={() => press(route)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 58 }}>
      <Ionicons name={detail.icon} size={21} color={focused ? theme.primary : theme.muted} />
      <Text style={{ color: focused ? theme.primary : theme.muted, fontSize: 10, fontWeight: focused ? '800' : '600', marginTop: 3 }}>{detail.label}</Text>
    </Pressable>;
  };
  const sosFocused = state.index === state.routes.findIndex((route: any) => route.name === 'sos');
  return <View style={{ height: 68, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEE9F7', paddingHorizontal: 8, shadowColor: '#2D1B69', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 8 }}>
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
      {beforeSos.map(regularTab)}
      {!!sos && <Pressable accessibilityRole="button" accessibilityLabel="SOS" accessibilityState={sosFocused ? { selected: true } : {}} onPress={() => press(sos)} style={{ width: 70, height: 58, marginHorizontal: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1.5, borderColor: '#7F1D1D', backgroundColor: '#7F1D1D' }}>
        <Ionicons name="alert" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11, marginTop: 2 }}>SOS</Text>
      </Pressable>}
      {afterSos.map(regularTab)}
    </View>
  </View>;
}
