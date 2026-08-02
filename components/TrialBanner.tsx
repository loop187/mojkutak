import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, SPACING } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Banner koji upozorava ugostitelja da licenca uskoro istječe (<= 7 dana).
 */
export default function TrialBanner() {
  const user = useAuthStore((s) => s.user);
  const daysUntilExpiry = useAuthStore((s) => s.daysUntilExpiry);

  if (!user || user.role !== 'owner' || user.licenseExpired) return null;

  const days = daysUntilExpiry();
  if (days === null || days > 7) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚠️ Vaša licenca istječe {days <= 0 ? 'danas' : `za ${days} ${days === 1 ? 'dan' : 'dana'}`}. Produljite ju na vrijeme.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  text: { color: '#fff', fontSize: FONT.small, fontWeight: '600', textAlign: 'center' },
});
