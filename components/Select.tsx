import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';

type Option = { label: string; value: string };

type Props = {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
};

export function Select({
  label,
  placeholder = 'Odaberite...',
  options,
  value,
  onChange,
  error,
  searchable = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  function pick(opt: Option) {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  }

  function clear() {
    onChange('');
    setQuery('');
  }

  return (
    <View style={{ gap: SPACING.xs }}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <TouchableOpacity
        onPress={() => { if (!disabled) setOpen(true); }}
        disabled={disabled}
        style={[
          styles.trigger,
          { opacity: disabled ? 0.6 : 1 },
          error ? { borderColor: COLORS.danger } : undefined,
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: selected ? COLORS.text : COLORS.textSecondary }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => { setOpen(false); setQuery(''); }}
          />
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.headerTitle}>{label ?? 'Odaberite'}</Text>
              {value ? (
                <TouchableOpacity onPress={clear}>
                  <Text style={styles.clear}>Poništi</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {searchable && (
              <View style={styles.searchWrap}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Pretraži..."
                  placeholderTextColor={COLORS.textSecondary}
                  style={styles.searchInput}
                  autoFocus
                />
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => pick(item)}
                    style={[
                      styles.option,
                      { backgroundColor: isSelected ? `${COLORS.primary}10` : 'transparent' },
                    ]}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: isSelected ? COLORS.primary : COLORS.text,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FONT.small,
    color: COLORS.text,
    fontWeight: '600',
  },
  trigger: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: FONT.body,
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  error: {
    color: COLORS.danger,
    fontSize: FONT.tiny,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT.subtitle,
    fontWeight: '800',
    color: COLORS.text,
  },
  clear: {
    fontSize: FONT.small,
    color: COLORS.danger,
    fontWeight: '600',
  },
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  option: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.border}80`,
  },
  optionLabel: {
    fontSize: FONT.body,
  },
  check: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
