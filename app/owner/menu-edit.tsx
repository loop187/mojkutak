import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  updateItem,
} from '../../services/menu';
import { MenuCategory, MenuItem } from '../../services/types';
import { getVenueMenu } from '../../services/venues';

export default function MenuEditScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();

  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');

  // Modal za artikl
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [itemNaziv, setItemNaziv] = useState('');
  const [itemOpis, setItemOpis] = useState('');
  const [itemCijena, setItemCijena] = useState('');

  const load = useCallback(async () => {
    if (!venueId) return;
    try {
      setMenu(await getVenueMenu(venueId));
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  }, [venueId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !venueId) return;
    const trimmed = newCategory.trim();
    const tempId = `tmp-${Date.now()}`;
    const nextRedoslijed = menu.length;

    setMenu((prev) => [...prev, { id: tempId, venueId, naziv: trimmed, redoslijed: nextRedoslijed, items: [] }]);
    setNewCategory('');

    try {
      const created = await createCategory(venueId, trimmed, nextRedoslijed);
      setMenu((prev) => prev.map((c) => (c.id === tempId ? created : c)));
    } catch (e) {
      setMenu((prev) => prev.filter((c) => c.id !== tempId));
      Alert.alert('Greška', apiErrorMessage(e));
    }
  };

  const handleDeleteCategory = (category: MenuCategory) => {
    Alert.alert('Brisanje', `Obrisati kategoriju "${category.naziv}" i sve njene artikle?`, [
      { text: 'Ne', style: 'cancel' },
      {
        text: 'Obriši',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(category.id);
            load();
          } catch (e) {
            Alert.alert('Greška', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  const openItemModal = (categoryId: string, item?: MenuItem) => {
    setTargetCategoryId(categoryId);
    setEditingItem(item ?? null);
    setItemNaziv(item?.naziv ?? '');
    setItemOpis(item?.opis ?? '');
    setItemCijena(item ? String(item.cijena) : '');
    setItemModalVisible(true);
  };

  const handleSaveItem = async () => {
    const cijena = parseFloat(itemCijena.replace(',', '.'));
    if (!itemNaziv.trim() || isNaN(cijena)) {
      Alert.alert('Greška', 'Unesite naziv i ispravnu cijenu');
      return;
    }
    const trimmedNaziv = itemNaziv.trim();
    const trimmedOpis = itemOpis.trim();

    if (editingItem) {
      try {
        await updateItem(editingItem.id, { naziv: trimmedNaziv, opis: trimmedOpis, cijena });
        setItemModalVisible(false);
        setItemNaziv('');
        setItemOpis('');
        setItemCijena('');
        setEditingItem(null);
        load();
      } catch (e) {
        Alert.alert('Greška', apiErrorMessage(e));
      }
      return;
    }

    if (!venueId || !targetCategoryId) return;

    const tempId = `tmp-${Date.now()}`;
    const tempItem: MenuItem = {
      id: tempId,
      venueId,
      categoryId: targetCategoryId,
      naziv: trimmedNaziv,
      opis: trimmedOpis,
      cijena,
      valuta: 'EUR',
      slika: null,
      dostupno: true,
      redoslijed: 0,
    };

    // Optimistički dodaj artikl odmah
    setMenu((prev) =>
      prev.map((c) => (c.id === targetCategoryId ? { ...c, items: [...c.items, tempItem] } : c))
    );
    setItemModalVisible(false);
    setItemNaziv('');
    setItemOpis('');
    setItemCijena('');

    try {
      const created = await createItem(venueId, {
        naziv: trimmedNaziv,
        opis: trimmedOpis,
        cijena,
        categoryId: targetCategoryId,
      });
      setMenu((prev) =>
        prev.map((c) =>
          c.id === targetCategoryId
            ? { ...c, items: c.items.map((i) => (i.id === tempId ? created : i)) }
            : c
        )
      );
    } catch (e) {
      setMenu((prev) =>
        prev.map((c) =>
          c.id === targetCategoryId ? { ...c, items: c.items.filter((i) => i.id !== tempId) } : c
        )
      );
      Alert.alert('Greška', apiErrorMessage(e));
    }
  };

  const handleDeleteItem = (item: MenuItem) => {
    Alert.alert('Brisanje', `Obrisati artikl "${item.naziv}"?`, [
      { text: 'Ne', style: 'cancel' },
      {
        text: 'Obriši',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(item.id);
            load();
          } catch (e) {
            Alert.alert('Greška', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await updateItem(item.id, { dostupno: !item.dostupno });
      load();
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Uređivanje menija' }} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 60 }}>
        <View style={styles.addCategoryRow}>
          <TextInput
            style={styles.addCategoryInput}
            placeholder="Nova kategorija (npr. Kave)"
            placeholderTextColor={COLORS.textSecondary}
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {menu.map((cat) => (
          <View key={cat.id} style={styles.category}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{cat.naziv}</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity onPress={() => openItemModal(cat.id)}>
                  <Text style={styles.categoryAction}>+ Artikl</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat)}>
                  <Text style={[styles.categoryAction, { color: COLORS.danger }]}>Obriši</Text>
                </TouchableOpacity>
              </View>
            </View>

            {cat.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => openItemModal(cat.id, item)}>
                  <Text style={[styles.itemName, !item.dostupno && styles.itemUnavailable]}>
                    {item.naziv}
                  </Text>
                  {!!item.opis && <Text style={styles.itemOpis}>{item.opis}</Text>}
                </TouchableOpacity>
                <Text style={styles.itemPrice}>{item.cijena.toFixed(2)} €</Text>
                <TouchableOpacity onPress={() => toggleAvailability(item)} hitSlop={6}>
                  <Text style={{ fontSize: 18 }}>{item.dostupno ? '✅' : '🚫'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteItem(item)} hitSlop={6}>
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}

            {cat.items.length === 0 && <Text style={styles.emptyCategory}>Nema artikala.</Text>}
          </View>
        ))}

        {menu.length === 0 && (
          <Text style={styles.empty}>Dodaj prvu kategoriju menija (npr. Kave, Pića, Jela...).</Text>
        )}
      </ScrollView>

      {/* Modal artikla */}
      <Modal visible={itemModalVisible} transparent animationType="slide" onRequestClose={() => setItemModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editingItem ? 'Uredi artikl' : 'Novi artikl'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Naziv *"
              placeholderTextColor={COLORS.textSecondary}
              value={itemNaziv}
              onChangeText={setItemNaziv}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Opis"
              placeholderTextColor={COLORS.textSecondary}
              value={itemOpis}
              onChangeText={setItemOpis}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Cijena (EUR) *"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="decimal-pad"
              value={itemCijena}
              onChangeText={setItemCijena}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setItemModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveItem}>
                <Text style={styles.btnPrimaryText}>Spremi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  addCategoryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  addCategoryInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  category: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryTitle: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.primary },
  categoryAction: { fontSize: FONT.small, color: COLORS.primary, fontWeight: '700' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  itemName: { fontSize: FONT.body, fontWeight: '600', color: COLORS.text },
  itemUnavailable: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  itemOpis: { fontSize: FONT.tiny, color: COLORS.textSecondary },
  itemPrice: { fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  emptyCategory: { fontSize: FONT.small, color: COLORS.textSecondary, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  modalTitle: { fontSize: FONT.subtitle, fontWeight: '800', color: COLORS.text },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
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
});
