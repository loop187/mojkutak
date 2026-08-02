import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme';
import { validate } from '../services/auth';
import { registerForPushNotifications } from '../services/push';
import { useAuthStore } from '../store/useAuthStore';

export default function RootLayout() {
  const { user, initialized, setUser, setInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Auto-login na startu
  useEffect(() => {
    validate()
      .then((u) => {
        setUser(u);
        if (u) registerForPushNotifications();
      })
      .finally(() => setInitialized(true));
  }, []);

  // Redirect logika
  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, segments]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
