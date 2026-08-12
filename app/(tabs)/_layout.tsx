import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/theme';
import LicenseExpiredModal from '../../components/LicenseExpiredModal';
import TrialBanner from '../../components/TrialBanner';
import { useAuthStore } from '../../store/useAuthStore';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);

  const isOwner = user?.role === 'owner';

  // Prikaži popup ako je licenca istekla (nakon prijave)
  useEffect(() => {
    if (isOwner && user?.licenseExpired) {
      setLicenseModalVisible(true);
    }
  }, [isOwner, user?.licenseExpired]);

  return (
    <>
      <TrialBanner />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.text, fontWeight: '700' },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Pretraga',
            href: isOwner ? null : undefined,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Novosti',
            href: isOwner ? null : undefined,
            tabBarIcon: ({ focused }) => <TabIcon emoji="📰" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="reservations"
          options={{
            title: 'Rezervacije',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="my-venues"
          options={{
            title: 'Moji objekti',
            href: isOwner ? undefined : null,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏪" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="staff"
          options={{
            title: 'Radnici',
            href: isOwner ? undefined : null,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🧑‍🍳" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="loyalty"
          options={{
            title: 'Loyalty',
            href: isOwner ? undefined : null,
            tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          }}
        />
      </Tabs>

      <LicenseExpiredModal
        visible={licenseModalVisible}
        onClose={() => setLicenseModalVisible(false)}
      />
    </>
  );
}
