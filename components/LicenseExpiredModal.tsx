import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { apiErrorMessage } from '../services/api';
import { getLicenseProduct, purchaseLicense } from '../services/products';
import { LicenseProduct, ProductVariation } from '../services/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Poziva se nakon uspješno kreirane narudžbe. */
  onPurchased?: () => void;
}

export default function LicenseExpiredModal({ visible, onClose, onPurchased }: Props) {
  const [product, setProduct] = useState<LicenseProduct | null>(null);
  const [selected, setSelected] = useState<ProductVariation | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setOrderMessage(null);
    setError(null);
    setLoading(true);
    getLicenseProduct()
      .then((p) => {
        setProduct(p);
        setSelected(p.variations[0] ?? null);
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [visible]);

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    setError(null);
    try {
      const result = await purchaseLicense(selected.id);
      setOrderMessage(result.message);
      onPurchased?.();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Licenca je istekla</Text>
          <Text style={styles.subtitle}>
            Za nastavak korištenja MojKutak usluga odaberite paket licence:
          </Text>

          {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />}

          {!loading && orderMessage && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ {orderMessage}</Text>
              <Text style={styles.successHint}>
                Upute za plaćanje stižu na vašu email adresu. Licenca se aktivira po primitku uplate.
              </Text>
            </View>
          )}

          {!loading && !orderMessage && product && (
            <ScrollView style={{ maxHeight: 320 }}>
              {product.variations.map((v) => {
                const isSelected = selected?.id === v.id;
                return (
                  <Pressable
                    key={v.id}
                    style={[styles.variation, isSelected && styles.variationSelected]}
                    onPress={() => setSelected(v)}
                  >
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.variationName}>{v.name}</Text>
                      {!!v.description && <Text style={styles.variationDesc}>{v.description}</Text>}
                    </View>
                    <Text style={styles.price}>
                      {v.price} {v.currency === 'EUR' ? '€' : v.currency}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
              <Text style={styles.btnSecondaryText}>{orderMessage ? 'Zatvori' : 'Kasnije'}</Text>
            </TouchableOpacity>
            {!orderMessage && (
              <TouchableOpacity
                style={[styles.btnPrimary, (!selected || purchasing) && styles.btnDisabled]}
                onPress={handlePurchase}
                disabled={!selected || purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Kupi licencu</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  title: { fontSize: FONT.title, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: FONT.body, color: COLORS.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.md },
  variation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  variationSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  variationName: { fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  variationDesc: { fontSize: FONT.small, color: COLORS.textSecondary },
  price: { fontSize: FONT.subtitle, fontWeight: '800', color: COLORS.primary },
  error: { color: COLORS.danger, fontSize: FONT.small, marginTop: SPACING.sm },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  successText: { color: COLORS.success, fontWeight: '700', fontSize: FONT.body },
  successHint: { color: COLORS.text, fontSize: FONT.small, marginTop: SPACING.xs },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  btnSecondaryText: { color: COLORS.textSecondary, fontWeight: '700' },
  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
