import { View } from 'react-native';
import PlaceList from '@/features/nearby/PlaceList';
import { H } from '@/ui/kit';
import { theme } from '@/ui/theme';

export default function Repair() {
  return (<View style={{ flex: 1, padding: 16, backgroundColor: theme.bg }}>
    <H>Nearest vehicle repair</H><PlaceList kind="repair" />
  </View>);
}
