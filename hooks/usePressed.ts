import { useCallback, useMemo, useState } from 'react';

/**
 * Lenyomott állapot `Pressable`-höz.
 *
 * A NativeWind interop-wrappere csendben eldobja a `style` prop
 * függvény-alakját (`style={({ pressed }) => …}`), ezért a lenyomott
 * állapotot magunk követjük, és a stílust objektumként adjuk át.
 * Lásd `docs/feature-tasks.md` – D-011.
 */
export function usePressed() {
  const [pressed, setPressed] = useState(false);

  const pressHandlers = useMemo(
    () => ({
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
    }),
    [],
  );

  // Ha a gomb letiltásra kerül lenyomott állapotban, az onPressOut elmaradhat.
  const reset = useCallback(() => setPressed(false), []);

  return { pressed, pressHandlers, reset };
}
