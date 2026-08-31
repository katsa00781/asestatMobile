import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';

import { colors, glow, letterSpacing, radius, tracking } from '@/constants/theme';
import { usePressed } from '@/hooks/usePressed';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);
  const eyeButton = usePressed();
  const submitButton = usePressed();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const message = await signIn(email, password);
    // Siker esetén az auth guard navigál el – itt nem állítjuk vissza a
    // submitting flaget, hogy a gomb ne villanjon vissza a váltás előtt.
    if (message) {
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg.base }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-32">
          <Text className="font-condensed text-h1 text-primary">ASE STATS</Text>
          <Text
            className="mt-6 font-condensed text-label uppercase text-muted"
            style={{ letterSpacing: letterSpacing(11, tracking.widest) }}
          >
            Statisztikai platform
          </Text>
        </View>

        <Field label="Email">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="nev@example.hu"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            inputMode="email"
            editable={!submitting}
            className="h-44 rounded-sm border border-line bg-surface1 px-14 font-body text-base text-primary"
          />
        </Field>

        <Field label="Jelszó">
          <View className="relative justify-center">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect={false}
              secureTextEntry={!passwordVisible}
              textContentType="password"
              editable={!submitting}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
              className="h-44 rounded-sm border border-line bg-surface1 pl-14 pr-44 font-body text-base text-primary"
            />
            <Pressable
              onPress={() => setPasswordVisible((visible) => !visible)}
              {...eyeButton.pressHandlers}
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: eyeButton.pressed ? 0.6 : 1,
              }}
            >
              {passwordVisible ? (
                <EyeOff size={18} color={colors.text.secondary} />
              ) : (
                <Eye size={18} color={colors.text.secondary} />
              )}
            </Pressable>
          </View>
        </Field>

        {error ? (
          <View
            className="mb-16 rounded-sm px-12 py-10"
            style={{ backgroundColor: glow.negative.fill, borderWidth: 1, borderColor: glow.negative.border }}
          >
            <Text className="font-body text-sm text-negative">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          {...submitButton.pressHandlers}
          disabled={!canSubmit}
          accessibilityRole="button"
          style={{
            height: 44,
            borderRadius: radius.md,
            backgroundColor: colors.accent.cyan,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !canSubmit ? 0.45 : submitButton.pressed ? 0.85 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={colors.text.onAccent} />
          ) : (
            <Text
              className="font-condensed text-sm uppercase text-on-accent"
              style={{ letterSpacing: letterSpacing(13, tracking.wide) }}
            >
              Bejelentkezés
            </Text>
          )}
        </Pressable>

        <Text className="mt-16 text-center font-body text-sm text-muted">
          A hozzáférést a klub adminisztrátora adja ki.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-16">
      <Text
        className="mb-8 font-condensed text-label uppercase text-secondary"
        style={{ letterSpacing: letterSpacing(11, tracking.label) }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}
