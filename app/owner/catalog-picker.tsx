import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import {
  addCatalogItemsToMenu,
  CatalogCategory,
  getCatalogCategories,
  getCatalogItems,
} from '../../services/catalog';
import { CatalogItem } from '../../services/types';

type Source = 'drink' | 'food';

interface Selection {
  cijena: string;
  item: CatalogItem;
}

export default function CatalogPickerScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [source, setSource] = useState<Source>('drink');
  const [category, setCategory] = useState<string | null>(null);

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Record<string, Selection>>({});

  const searchInputRef = useRef<TextInput>(null);

  const loadCategories = useCallback(async (s: Source) => {
    setLoading(true);
    try {
      const data = await getCatalogCategories(s);
      setCategories(data);
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadItems = useCallback(
    async (
      p: number,
      opts: { source: Source; category: string; search?: string }
    ) => {
      setLoading(true);
      try {
        const data = await getCatalogItems({
          source: opts.source,
          category: opts.category,
          search: opts.search,
          page: p,
          per_page: 50,
        });
        setItems((prev) => (p === 1 ? data.items : [...prev, ...data.items]));
        setTotalPages(data.totalPages);
      } catch (e) {
        Alert.alert('Greška', apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCategories(source);
  }, [source, loadCategories]);

  const handleSourceChange = (s: Source) => {
    setSource(s);
    setCategory(null);
    setCategoryFilter('');
    setSearch('');
    setItems([]);
    setPage(1);
    setSelected({});
    loadCategories(s);
  };

  const handleCategoryPress = (cat: string) => {
    setCategory(cat);
    setSearch('');
    setItems([]);
    setPage(1);
    loadItems(1, { source, category: cat, search: '' });
  };

  const handleSearch = () => {
    if (!category) return;
    setPage(1);
    setItems([]);
    loadItems(1, { source, category, search });
  };

  const handleEndReached = () => {
    if (!category || loading || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    loadItems(next, { source, category, search });
  };

  const goBack = () => {
    if (category) {
      setCategory(null);
      setSearch('');
      setCategoryFilter('');
      setItems([]);
      setPage(1);
    } else {
      router.back();
    }
  };

  const toggleItem = (item: CatalogItem) => {
    setSelected((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { cijena: '', item } };
    });
  };

  const setPrice = (id: string, cijena: string) => {
    setSelected((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], cijena } };
    });
  };

  const handleSave = async () => {
    const toAdd = Object.entries(selected)
      .map(([catalogItemId, { cijena }]) => {
        const value = cijena.trim().replace(',', '.');
        const parsed = value ? parseFloat(value) : NaN;
        if (isNaN(parsed) || parsed < 0) return null;
        return { catalogItemId, cijena: parsed };
      })
      .filter(Boolean) as { catalogItemId: string; cijena: number }[];

    if (toAdd.length === 0) {
      Alert.alert('Nijedan artikl nije spreman', 'Označite artikle i upišite ispravne cijene.');
      return;
    }

    setSaving(true);
    try {
      const result = await addCatalogItemsToMenu(venueId, toAdd);
      Alert.alert(
        'Dodano u meni',
        `${result.count} artikala je dodano u meni.`,
        [{ text: 'U redu', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = Object.keys(selected).length;
  const validCount = Object.values(selected).filter(
    (s) => !isNaN(parseFloat(s.cijena.trim().replace(',', '.'))) && parseFloat(s.cijena.trim().replace(',', '.')) > 0
  ).length;

  const filteredCategories = categories.filter((c) =>
    c.category.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  const renderCategory = ({ item }: { item: CatalogCategory }) => (
    <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress(item.category)}>
      <Text style={styles.categoryName}>{item.category}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={styles.categoryCount}>{item.itemCount} artikala</Text>
        <Text style={{ color: COLORS.primary, fontSize: 18 }}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: CatalogItem }) => {
    const sel = selected[item.id];
    const meta = [
      item.brand,
      item.subcategory,
      item.volumeMl ? `${item.volumeMl} ${item.packageType || 'ml'}` : undefined,
      item.country,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <View style={styles.row}>
        <TouchableOpacity onPress={() => toggleItem(item)} style={styles.checkbox}>
          <Text style={styles.checkText}>{sel ? '☑' : '◻'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.displayName}</Text>
          {!!meta && <Text style={styles.meta}>{meta}</Text>}
        </View>
        <TextInput
          style={[styles.priceInput, !sel && styles.priceInputDisabled]}
          keyboardType="decimal-pad"
          placeholder="€"
          placeholderTextColor={COLORS.textSecondary}
          value={sel ? sel.cijena : ''}
          editable={!!sel}
          onChangeText={(text) => setPrice(item.id, text)}
          onSubmitEditing={handleSearch}
        />
      </View>
    );
  };

  const screenTitle = category ?? 'Katalog';

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <View
              style={{
                paddingTop: insets.top + 8,
                paddingHorizontal: SPACING.md,
                paddingBottom: SPACING.sm,
                backgroundColor: COLORS.card,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity onPress={goBack} hitSlop={8}>
                <Text style={{ fontSize: 24, color: COLORS.primary }}>←</Text>
              </TouchableOpacity>
              <Text
                style={{
                  marginLeft: SPACING.sm,
                  fontSize: FONT.subtitle,
                  fontWeight: '700',
                  color: COLORS.text,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {screenTitle}
              </Text>
              <TouchableOpacity onPress={() => router.push(`/owner/menu-edit?venueId=${venueId}`)}>
                <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: FONT.small }}>
                  Ručno
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={{ padding: SPACING.md }}>
          <View style={styles.sourceTabs}>
            {(['drink', 'food'] as Source[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sourceTab, source === s && styles.sourceTabActive]}
                onPress={() => handleSourceChange(s)}
              >
                <Text style={[styles.sourceTabText, source === s && styles.sourceTabTextActive]}>
                  {s === 'drink' ? 'Pića' : 'Hrana'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {category === null ? (
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Filtriraj kategorije..."
                placeholderTextColor={COLORS.textSecondary}
                value={categoryFilter}
                onChangeText={setCategoryFilter}
              />
            </View>
          ) : (
            <View style={styles.searchRow}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={`Pretraži u kategoriji ${category}...`}
                placeholderTextColor={COLORS.textSecondary}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Text style={styles.searchBtnText}>🔍</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {category === null ? (
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.category}
            renderItem={renderCategory}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl }}
            ListEmptyComponent={
              loading ? null : (
                <Text style={styles.empty}>Nema kategorija.</Text>
              )
            }
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            extraData={selected}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl }}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              loading ? null : (
                <Text style={styles.empty}>Nema artikala u ovoj kategoriji.</Text>
              )
            }
            ListFooterComponent={
              loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
              ) : null
            }
          />
        )}

        {(validCount > 0 || selectedCount > 0) && (
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + SPACING.md },
            ]}
          >
            <Text style={styles.footerText}>
              Označeno: {selectedCount} · s cijenom: {validCount}
            </Text>
            <TouchableOpacity
              style={[styles.saveBtn, (saving || validCount === 0) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || validCount === 0}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  Dodaj {validCount} u meni
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: SPACING.sm },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT.body,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontSize: 18 },
  sourceTabs: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  sourceTab: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  sourceTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sourceTabText: { color: COLORS.text, fontWeight: '600' },
  sourceTabTextActive: { color: '#fff' },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryName: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text },
  categoryCount: { fontSize: FONT.small, color: COLORS.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  checkbox: { padding: 4 },
  checkText: { fontSize: 24, color: COLORS.primary },
  name: { fontSize: FONT.body, fontWeight: '600', color: COLORS.text },
  meta: { fontSize: FONT.tiny, color: COLORS.textSecondary, marginTop: 2 },
  priceInput: {
    width: 80,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    color: COLORS.text,
    textAlign: 'right',
    fontSize: FONT.body,
  },
  priceInputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.textSecondary,
  },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
  footer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  footerText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: FONT.small },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: COLORS.border },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.body },
});
