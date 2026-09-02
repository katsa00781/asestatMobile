/** A tabon belüli lapozás (lista → részletek) saját stackben fut. */
import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    />
  );
}
