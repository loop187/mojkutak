import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { POST_TIPOVI } from '../../constants/options';
import { apiErrorMessage } from '../../services/api';
import { createPost } from '../../services/posts';

type PostTip = 'ponuda' | 'event' | 'obavijest';

export default function PostCreateScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const router = useRouter();

  const [tip, setTip] = useState<PostTip>('ponuda');
  const [naslov, setNaslov] = useState('');
  const [opis, setOpis] = useState('');
  const [pocetak, setPocetak] = useState<Date | null>(null);
  const [kraj, setKraj] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'pocetak' | 'kraj' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setImageBase64(result.assets[0].base64);
    setImageMime(result.assets[0].mimeType ?? 'image/jpeg');
    setImageUri(result.assets[0].uri);
  };

  const openPicker = (target: 'pocetak' | 'kraj') => {
    setPickerTarget(target);
    setPickerMode('date');
  };

  const onPickerChange = (_: unknown, date?: Date) => {
    if (!date || !pickerTarget) {
      setPickerTarget(null);
      return;
    }
    const setter = pickerTarget === 'pocetak' ? setPocetak : setKraj;
    setter(date);

    if (pickerMode === 'date') {
      // Nakon datuma pitaj i vrijeme
      setPickerMode('time');
    } else {
      setPickerTarget(null);
    }
  };

  const formatDate = (d: Date | null) =>
    d
      ? `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      : null;

  const handleSave = async () => {
    if (!naslov.trim() || !venueId) {
      Alert.alert('Greška', 'Naslov je obavezan');
      return;
    }
    setSaving(true);
    try {
      await createPost(venueId, {
        tip,
        naslov: naslov.trim(),
        opis,
        pocetak: pocetak ? pocetak.toISOString() : null,
        kraj: kraj ? kraj.toISOString() : null,
        imageBase64: imageBase64 ?? undefined,
        mime: imageMime,
      });
      Alert.alert('Uspjeh', 'Objava kreirana! Pratitelji su primili obavijest. 📢');
      router.back();
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Nova objava' }} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 60 }}>
        <Text style={styles.label}>Tip objave</Text>
        <View style={styles.chips}>
          {POST_TIPOVI.map((t) => (
            <Pressable
              key={t.value}
              style={[styles.chip, tip === t.value && styles.chipActive]}
              onPress={() => setTip(t.value as PostTip)}
            >
              <Text style={[styles.chipText, tip === t.value && styles.chipTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Naslov *</Text>
        <TextInput
          style={styles.input}
          placeholder="npr. Happy hour 17-19h!"
          placeholderTextColor={COLORS.textSecondary}
          value={naslov}
          onChangeText={setNaslov}
        />

        <Text style={styles.label}>Opis</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          placeholder="Detalji ponude ili eventa..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          value={opis}
          onChangeText={setOpis}
        />

        <Text style={styles.label}>Trajanje (opcionalno)</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('pocetak')}>
          <Text style={styles.pickerText}>📅 Početak: {formatDate(pocetak) ?? 'nije postavljen'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('kraj')}>
          <Text style={styles.pickerText}>🏁 Kraj: {formatDate(kraj) ?? 'nije postavljen'}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Nakon kraja objava se automatski skriva.</Text>

        {pickerTarget && (
          <DateTimePicker
            value={(pickerTarget === 'pocetak' ? pocetak : kraj) ?? new Date()}
            mode={pickerMode}
            is24Hour
            display={Platform.OS === 'android' ? 'default' : 'spinner'}
            onChange={onPickerChange}
          />
        )}

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={styles.imagePickerText}>📷 Dodaj sliku (opcionalno)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Objavi 📢</Text>}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  label: { fontSize: FONT.small, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.xs },
  chips: { flexDirection: 'row', gap: SPACING.xs },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: COLORS.card,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.small, color: COLORS.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT.body,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  pickerBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  pickerText: { fontSize: FONT.body, color: COLORS.text },
  hint: { fontSize: FONT.tiny, color: COLORS.textSecondary },
  imagePicker: {
    height: 140,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imagePickerText: { color: COLORS.primaryDark, fontWeight: '600' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.body },
});
