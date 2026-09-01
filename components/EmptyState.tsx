/**
 * Üres állapot – a lekérdezés lefutott, de nincs megjeleníthető adat.
 *
 * A mockupok nem tartalmaznak üres állapotot, ezért a P0 Style Tile elemeiből
 * épül: surface1 ikondoboz subtle kerettel, Barlow Condensed ALL CAPS cím,
 * DM Sans magyarázat. Gomb szándékosan nincs rajta – a hibás lekérdezést az
 * `ErrorPanel` kezeli, az üres eredmény a szűrő átállításával oldható fel.
 */
import { Text, View } from 'react-native';
import { Inbox, type LucideIcon } from 'lucide-react-native';

import { colors, fontSize, letterSpacing, tracking } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  /** Mit tehet a felhasználó – pl. „Válassz másik szezont." */
  description?: string;
  /** Képernyőnként beszédesebb ikon adható, alapértelmezés: `Inbox`. */
  icon?: LucideIcon;
}

export function EmptyState({ title, description, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <View className="items-center px-24 py-32">
      <View className="h-56 w-56 items-center justify-center rounded-xl border border-line bg-surface1">
        <Icon size={24} color={colors.text.muted} strokeWidth={1.6} />
      </View>

      <Text
        className="mt-16 text-center font-condensed text-md uppercase text-secondary"
        style={{ letterSpacing: letterSpacing(fontSize.md, tracking.label) }}
      >
        {title}
      </Text>

      {description ? (
        <Text className="mt-6 text-center font-body text-sm text-muted">{description}</Text>
      ) : null}
    </View>
  );
}
