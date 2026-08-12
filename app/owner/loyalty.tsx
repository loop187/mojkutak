import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { Select } from '../../components/Select';
import { apiErrorMessage } from '../../services/api';
import {
  addVenueReward,
  deleteReward,
  getVenueRewards,
  LoyaltyReward,
} from '../../services/loyalty';
import { getVenue, getVenueMenu, updateVenue } from '../../services/venues';
import { MenuCategory, Venue } from '../../services/types';

export default function VenueLoyaltyScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);

  // Postavke
  const [enabled, setEnabled] = useState(false);
  const [bodoviPoEuru, setBodoviPoEuru] = useState('1');
  const [savingSettings, setSavingSettings] = useState(false);

  // Nova nagrada
  const [menuItemId, setMenuItemId] = useState('');
  const [popust, setPopust] = useState('100');
  const [bodovi, setBodovi] = useState('');
  const [addingReward, setAddingReward] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    (async () => {
      try {
        const [v, m, r] = await Promise.all([
          getVenue(venueId),
          getVenueMenu(venueId),
          getVenueRewards(venueId),
        ]);
        setVenue(v);
        setMenu(m);
        setRewards(r);
        setEnabled(v.loyalty);
        setBodoviPoEuru(String(v.bodoviPoEuru ?? 1));
      } catch (e) {
        Alert.alert('Greška', apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [venueId]);

  const itemOptions = useMemo(
    () =>
      menu.flatMap((cat) =>
        cat.items.map((item) => ({
          label: `${item.naziv} (${item.cijena.toFixed(2)} €)`,
          value: item.id,
        }))
      ),
    [menu]
  );

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const v = await updateVenue(venueId, {
        loyalty: enabled,
        bodoviPoEuru: Math.max(0, parseFloat(bodoviPoEuru.replace(',', '.')) || 1),
      });
      setVenue(v);
      Alert.alert('Spremljeno', 'Postavke loyalty programa su ažurirane.');
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddReward = async () => {
    const popustNum = parseInt(popust, 10);
    const bodoviNum = parseInt(bodovi, 10);
    if (!menuItemId) {
      Alert.alert('Odaberite artikl');
      return;
    }
    if (!popustNum || popustNum < 1 || popustNum > 100) {
      Alert.alert('Popust mora biti između 1 i 100%');
      return;
    }
    if (!bodoviNum || bodoviNum < 1) {
      Alert.alert('Unesite broj bodova');
      return;
    }
    setAddingReward(true);
    try {
      const updated = await addVenueReward(venueId, {
        menuItemId,
        popust: popustNum,
        bodovi: bodoviNum,
      });
      setRewards(updated);
      setMenuItemId('');
      setPopust('100');
      setBodovi('');
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setAddingReward(false);
    }
  };

  const handleDeleteReward = (reward: LoyaltyReward) => {
    Alert.alert('Brisanje nagrade', `Obrisati nagradu "${reward.naziv}"?`, [
      { text: 'Ne', style: 'cancel' },
      {
        text: 'Da, obriši',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReward(reward.id);
            setRewards((prev) => prev.filter((r) => r.id !== reward.id));
          } catch (e) {
            Alert.alert('Greška', apiErrorMessage(e));
          }
        },
      },
    ]);
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
      <Stack.Screen options={{ headerShown: true, title: `Loyalty — ${venue?.naziv ?? ''}` }} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Postavke</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Loyalty program uključen</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
            />
          </View>
          <Text style={styles.label}>Bodovi po euru</Text>
          <TextInput
            style={styles.input}
            value={bodoviPoEuru}
            onChangeText={setBodoviPoEuru}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={COLORS.textSecondary}
          />
          <Text style={styles.hint}>
            Npr. 1 znači da gost za svaki euro narudžbe dobiva 1 bod. Bodovi se dodjeljuju kada
            osoblje označi narudžbu odrađenom.
          </Text>
          <Pressable style={styles.saveBtn} onPress={saveSettings} disabled={savingSettings}>
            {savingSettings ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Spremi postavke</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nova nagrada</Text>
          <Select
            label="Artikl"
            options={itemOptions}
            value={menuItemId}
            onChange={setMenuItemId}
            searchable
            placeholder="Odaberite artikl s menija..."
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Popust (%)</Text>
              <TextInput
                style={styles.input}
                value={popust}
                onChangeText={setPopust}
                keyboardType="number-pad"
                placeholder="100"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Bodovi</Text>
              <TextInput
                style={styles.input}
                value={bodovi}
                onChangeText={setBodovi}
                keyboardType="number-pad"
                placeholder="npr. 50"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>
          <Text style={styles.hint}>Popust 100% znači da je artikl besplatan.</Text>
          <Pressable style={styles.saveBtn} onPress={handleAddReward} disabled={addingReward}>
            {addingReward ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Dodaj nagradu</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, { marginBottom: SPACING.xl }]}>
          <Text style={styles.sectionTitle}>Nagrade ({rewards.length})</Text>
          {rewards.length === 0 && (
            <Text style={styles.hint}>Još nema nagrada. Dodajte prvu iznad.</Text>
          )}
          {rewards.map((reward) => (
            <View key={reward.id} style={styles.rewardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardName}>{reward.naziv}</Text>
                <Text style={styles.rewardMeta}>
                  {reward.popust === 100 ? 'Besplatno' : `−${reward.popust}%`} · {reward.bodovi}{' '}
                  bodova
                </Text>
              </View>
              <Pressable style={styles.removeBtn} onPress={() => handleDeleteReward(reward)}>
                <Text style={styles.removeBtnText}>Obriši</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: { fontSize: FONT.small, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT.body,
    marginBottom: SPACING.sm,
  },
  hint: { fontSize: FONT.tiny, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', gap: SPACING.sm },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rewardName: { fontSize: FONT.body, fontWeight: '600', color: COLORS.text },
  rewardMeta: { fontSize: FONT.small, color: COLORS.textSecondary },
  removeBtn: {
    borderWidth: 1,
    borderColor: '#d9534f',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  removeBtnText: { color: '#d9534f', fontSize: FONT.small, fontWeight: '600' },
});
