import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { features } from '@/core/registry';
import Header from '@/ui/Header';
import AppTabBar from '@/ui/AppTabBar';

export default function AppLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ header: () => <Header /> }}>
      {features.map((f) => (
        <Tabs.Screen key={f.key} name={f.route} options={{
          title: f.title,
          href: f.enabled ? undefined : null, // hides the tab when the feature is disabled
          tabBarIcon: ({ color, size }) => <Ionicons name={f.icon as any} color={color} size={size} />,
        }} />
      ))}
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
