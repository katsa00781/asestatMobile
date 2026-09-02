/**
 * Ideiglenes képernyő azoknak a taboknak, amelyek a saját feladatukban
 * készülnek el. A fejléc és a cím már a végleges – csak a tartalom hiányzik,
 * hogy a tabsáv és a szűrő az öt tabbal együtt kipróbálható legyen.
 */
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hammer } from 'lucide-react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';

interface PlaceholderScreenProps {
  /** ALL CAPS képernyőcím, pl. „JÁTÉKOSOK". */
  title: string;
  description?: string;
}

export function PlaceholderScreen({
  title,
  description = 'Ez a képernyő a következő lépésben készül el.',
}: PlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-base" style={{ paddingTop: insets.top }}>
      <AppHeader />
      <Text className="px-16 py-16 font-condensed text-stat uppercase text-primary">{title}</Text>
      <EmptyState icon={Hammer} title="Hamarosan" description={description} />
    </View>
  );
}
