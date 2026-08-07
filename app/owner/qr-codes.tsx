import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import { getVenueQrCodes, VenueQrCode } from '../../services/venues';

export default function VenueQrCodesScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const [codes, setCodes] = useState<VenueQrCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVenueQrCodes(venueId)
      .then(setCodes)
      .catch((e) => Alert.alert('Greška', apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [venueId]);

  const share = async (item: VenueQrCode) => {
    try {
      await Share.share({ message: `Stol ${item.brojStola}: ${item.url}` });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'QR kodovi stolova' }} />
      <FlatList
        data={codes}
        keyExtractor={(item) => String(item.brojStola)}
        contentContainerStyle={{ padding: SPACING.md }}
        ListHeaderComponent={
          <Text style={styles.info}>
            Ispisaj i postavi jedan QR kod po stolu. Gost skenira kod i otvara mu se meni tog stola.
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>QR kodovi još nisu generirani.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>Stol {item.brojStola}</Text>
            <Text style={styles.url}>{item.url}</Text>
            <Pressable style={styles.btn} onPress={() => share(item)}>
              <Text style={styles.btnText}>Podijeli URL</Text>
            </Pressable>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  info: { fontSize: FONT.small, color: COLORS.textSecondary, marginBottom: SPACING.md },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  url: { fontSize: FONT.small, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FONT.small },
});
