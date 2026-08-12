import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { apiErrorMessage } from '../services/api';
import { getVenue, getVenueMenu } from '../services/venues';
import { MenuCategory, MenuItem, Venue } from '../services/types';
import { createDeliveryOrder, createOrder } from '../services/orders';
import { getMyVenueLoyalty, LoyaltyReward, MyVenueLoyalty } from '../services/loyalty';
import { QrScanResult, scanQrCode } from '../services/scan';
import { useAuthStore } from '../store/useAuthStore';

interface CartItem {
  item: MenuItem;
  kolicina: number;
}

export default function NaruciScreen() {
  const { code, venueId } = useLocalSearchParams<{ code?: string; venueId?: string }>();
  const insets = useSafeAreaInsets();
  const isDelivery = !code && !!venueId;
  const [scan, setScan] = useState<QrScanResult | null>(null);
  const [deliveryVenue, setDeliveryVenue] = useState<Venue | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [napomena, setNapomena] = useState('');
  const [adresa, setAdresa] = useState('');
  const [telefon, setTelefon] = useState('');
  const [sending, setSending] = useState(false);
  const user = useAuthStore((s) => s.user);
  const [loyalty, setLoyalty] = useState<MyVenueLoyalty | null>(null);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);

  useEffect(() => {
    if (!code && !venueId) return;
    (async () => {
      try {
        let resolvedVenueId: string | null = null;
        if (isDelivery) {
          const [v, menuData] = await Promise.all([getVenue(venueId!), getVenueMenu(venueId!)]);
          setDeliveryVenue(v);
          setMenu(menuData);
          resolvedVenueId = v.id;
        } else if (code) {
          const result = await scanQrCode(code);
          setScan(result);
          const menuData = await getVenueMenu(String(result.venue.id));
          setMenu(menuData);
          resolvedVenueId = String(result.venue.id);
        }
        // Loyalty bodovi i nagrade (samo za ulogirane)
        if (resolvedVenueId && user) {
          const l = await getMyVenueLoyalty(resolvedVenueId);
          if (l) setLoyalty(l);
        }
      } catch (e) {
        Alert.alert('Greška', apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [code, venueId]);

  const rewardPrice = (r: LoyaltyReward) => Math.round(r.cijena * (1 - r.popust / 100) * 100) / 100;

  const ukupno = useMemo(() => {
    const base = Object.values(cart).reduce((sum, ci) => sum + ci.item.cijena * ci.kolicina, 0);
    return base + (selectedReward ? rewardPrice(selectedReward) : 0);
  }, [cart, selectedReward]);

  const updateCart = (item: MenuItem, delta: number) => {
    setCart((prev) => {
      const current = prev[item.id]?.kolicina ?? 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: { item, kolicina: next } };
    });
  };

  const submit = async () => {
    const items = Object.values(cart).map((ci) => ({
      menuItemId: ci.item.id,
      kolicina: ci.kolicina,
    }));
    if (items.length === 0 && !selectedReward) {
      Alert.alert('Košarica je prazna');
      return;
    }
    if (isDelivery && (!adresa.trim() || !telefon.trim())) {
      Alert.alert('Unesite adresu i telefon za dostavu');
      return;
    }
    setSending(true);
    try {
      const rewardId = selectedReward?.id;
      if (isDelivery) {
        await createDeliveryOrder(venueId!, items, adresa.trim(), telefon.trim(), napomena || undefined, rewardId);
        Alert.alert('Narudžba zaprimljena', 'Dostava je na putu čim je objekt potvrdi.');
      } else {
        await createOrder(code!, items, napomena || undefined, rewardId);
        Alert.alert('Narudžba zaprimljena', 'Konobar će vam uskoro donijeti narudžbu.');
      }
      setCart({});
      setNapomena('');
      setSelectedReward(null);
      if (loyalty && selectedReward) {
        setLoyalty({ ...loyalty, bodovi: loyalty.bodovi - selectedReward.bodovi });
      }
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!scan && !deliveryVenue) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>{isDelivery ? 'Objekt nije pronađen.' : 'QR kod nije pronađen.'}</Text>
      </View>
    );
  }

  const venueNaziv = isDelivery ? deliveryVenue!.naziv : scan!.venue.naziv;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={{ padding: SPACING.md, paddingTop: insets.top + SPACING.md, paddingBottom: 140 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{venueNaziv}</Text>
          <Text style={styles.subtitle}>{isDelivery ? 'Dostava' : `Stol ${scan!.brojStola}`}</Text>
        </View>

        <Text style={styles.section}>Meni</Text>
        {menu.length === 0 && <Text style={styles.empty}>Meni je prazan.</Text>}
        {menu.map((category) => (
          <View key={category.id} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.naziv}</Text>
            {category.items.map((item) => {
              const cartItem = cart[item.id];
              return (
                <View key={item.id} style={styles.item}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.naziv}</Text>
                    <Text style={styles.itemPrice}>{item.cijena.toFixed(2)} €</Text>
                  </View>
                  {!!item.opis && <Text style={styles.itemDesc}>{item.opis}</Text>}
                  <View style={styles.qtyRow}>
                    <Pressable style={styles.qtyBtn} onPress={() => updateCart(item, -1)} disabled={!cartItem}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyText}>{cartItem?.kolicina ?? 0}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => updateCart(item, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {loyalty && (
          <>
            <Text style={styles.section}>⭐ Loyalty — imaš {loyalty.bodovi} bodova</Text>
            {loyalty.rewards.length === 0 && (
              <Text style={styles.itemDesc}>Ovaj objekt još nema nagrada.</Text>
            )}
            {loyalty.rewards.map((reward) => {
              const affordable = loyalty.bodovi >= reward.bodovi;
              const selected = selectedReward?.id === reward.id;
              return (
                <Pressable
                  key={reward.id}
                  style={[
                    styles.item,
                    selected && { borderColor: COLORS.primary, borderWidth: 2 },
                    !affordable && { opacity: 0.5 },
                  ]}
                  disabled={!affordable}
                  onPress={() => setSelectedReward(selected ? null : reward)}
                >
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>
                      {selected ? '✅ ' : ''}
                      {reward.naziv}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {reward.popust === 100 ? 'Gratis' : `−${reward.popust}%`}
                    </Text>
                  </View>
                  <Text style={styles.itemDesc}>
                    {reward.bodovi} bodova
                    {reward.popust < 100 ? ` · plaćaš ${rewardPrice(reward).toFixed(2)} €` : ''}
                    {!affordable ? ` · nedostaje ${reward.bodovi - loyalty.bodovi} bodova` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </>
        )}

        {isDelivery && (
          <>
            <Text style={styles.section}>Podaci za dostavu</Text>
            <TextInput
              style={[styles.input, { minHeight: 0, marginBottom: SPACING.sm }]}
              value={adresa}
              onChangeText={setAdresa}
              placeholder="Adresa dostave"
              placeholderTextColor={COLORS.textSecondary}
            />
            <TextInput
              style={[styles.input, { minHeight: 0, marginBottom: SPACING.md }]}
              value={telefon}
              onChangeText={setTelefon}
              placeholder="Broj telefona"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
            />
          </>
        )}

        <Text style={styles.section}>Napomena</Text>
        <TextInput
          style={styles.input}
          value={napomena}
          onChangeText={setNapomena}
          placeholder="Npr. bez leda, bez luka..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Text style={styles.total}>Ukupno: {ukupno.toFixed(2)} €</Text>
        <Pressable style={styles.orderBtn} onPress={submit} disabled={sending}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.orderBtnText}>Naruči</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  empty: { color: COLORS.textSecondary, fontSize: FONT.body },
  header: { marginBottom: SPACING.md },
  title: { fontSize: FONT.title, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT.subtitle, color: COLORS.textSecondary, marginTop: SPACING.xs },
  section: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  category: { marginBottom: SPACING.md },
  categoryTitle: { fontSize: FONT.body, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm },
  item: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  itemName: { fontSize: FONT.body, fontWeight: '600', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  itemPrice: { fontSize: FONT.body, color: COLORS.text, fontWeight: '700' },
  itemDesc: { fontSize: FONT.small, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  qtyBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  qtyText: { width: 40, textAlign: 'center', fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  total: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  orderBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  orderBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.body },
});
