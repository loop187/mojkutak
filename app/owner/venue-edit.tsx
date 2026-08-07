import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { DANI, SADRZAJI, VENUE_TIPOVI } from '../../constants/options';
import { Select } from '../../components/Select';
import { COUNTIES, PLACE_TO_COUNTIES } from '../../constants/places';
import { apiErrorMessage } from '../../services/api';
import { RadnoVrijeme } from '../../services/types';
import { createVenue, getVenue, updateVenue, uploadVenuePhoto } from '../../services/venues';

export default function VenueEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const isEdit = !!id;

  const [naziv, setNaziv] = useState('');
  const [tip, setTip] = useState('kafic');
  const [opis, setOpis] = useState('');
  const [zupanija, setZupanija] = useState('');
  const [mjesto, setMjesto] = useState('');
  const [adresa, setAdresa] = useState('');
  const [telefon, setTelefon] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [sadrzaji, setSadrzaji] = useState<string[]>([]);
  const [radnoVrijeme, setRadnoVrijeme] = useState<RadnoVrijeme>({});
  const [rezervacije, setRezervacije] = useState(true);
  const [brojStolova, setBrojStolova] = useState('1');
  const [qrNarudzbe, setQrNarudzbe] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [coverMime, setCoverMime] = useState('image/jpeg');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getVenue(id)
      .then((v) => {
        setNaziv(v.naziv);
        setTip(v.tip);
        setOpis(v.opis);
        setZupanija(v.zupanija);
        setMjesto(v.mjesto);
        setAdresa(v.adresa);
        setTelefon(v.telefon);
        setLat(v.lat);
        setLng(v.lng);
        setSadrzaji(v.sadrzaji);
        setRadnoVrijeme(v.radnoVrijeme || {});
        setRezervacije(v.rezervacijeUkljucene);
        setBrojStolova(String(v.brojStolova ?? 1));
        setQrNarudzbe(v.qrNarudzbe);
        setCoverPhoto(v.coverPhoto);
      })
      .catch((e) => Alert.alert('Greška', apiErrorMessage(e)));
  }, [id]);

  const countyOptions = useMemo(() => COUNTIES, []);

  const placeOptions = useMemo(() => {
    if (!zupanija) return [];
    return Object.keys(PLACE_TO_COUNTIES)
      .filter((place) => PLACE_TO_COUNTIES[place].includes(zupanija))
      .sort((a, b) => a.localeCompare(b, 'hr'))
      .map((p) => ({ label: p, value: p }));
  }, [zupanija]);

  const toggleSadrzaj = (value: string) => {
    setSadrzaji((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const setRadno = (dan: string, field: 'od' | 'do', value: string) => {
    setRadnoVrijeme((prev) => {
      const current = prev[dan] ?? { od: '', do: '' };
      return { ...prev, [dan]: { ...current, [field]: value } };
    });
  };

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Greška', 'Dozvola za lokaciju nije odobrena');
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLat(loc.coords.latitude);
      setLng(loc.coords.longitude);
      Alert.alert('Uspjeh', 'GPS lokacija spremljena ✅');
    } catch {
      Alert.alert('Greška', 'Nije moguće dohvatiti lokaciju');
    }
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setCoverBase64(result.assets[0].base64);
    setCoverMime(result.assets[0].mimeType ?? 'image/jpeg');
    setCoverPhoto(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!naziv.trim()) {
      Alert.alert('Greška', 'Naziv objekta je obavezan');
      return;
    }
    setSaving(true);
    try {
      const input = {
        naziv: naziv.trim(),
        tip,
        opis,
        zupanija,
        mjesto,
        adresa,
        telefon,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        sadrzaji,
        radnoVrijeme,
        rezervacijeUkljucene: rezervacije,
        brojStolova: Math.max(1, parseInt(brojStolova || '1', 10) || 1),
        qrNarudzbe,
      };

      const venue = isEdit ? await updateVenue(id!, input) : await createVenue(input);

      if (coverBase64) {
        await uploadVenuePhoto(venue.id, coverBase64, 'cover', coverMime);
      }

      Alert.alert('Uspjeh', isEdit ? 'Objekt ažuriran!' : 'Objekt kreiran!');
      router.back();
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: isEdit ? 'Uredi objekt' : 'Novi objekt' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 60 }}>
          <TouchableOpacity style={styles.coverPicker} onPress={pickCover}>
            {coverPhoto ? (
              <Image source={{ uri: coverPhoto }} style={styles.coverImage} />
            ) : (
              <Text style={styles.coverPickerText}>📷 Dodaj naslovnu sliku</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Naziv objekta *</Text>
          <TextInput style={styles.input} value={naziv} onChangeText={setNaziv} placeholder="npr. Caffe bar Kutak" placeholderTextColor={COLORS.textSecondary} />

          <Text style={styles.label}>Tip objekta *</Text>
          <View style={styles.chips}>
            {VENUE_TIPOVI.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.chip, tip === t.value && styles.chipActive]}
                onPress={() => setTip(t.value)}
              >
                <Text style={[styles.chipText, tip === t.value && styles.chipTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Opis</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={opis}
            onChangeText={setOpis}
            multiline
            placeholder="Kratki opis objekta..."
            placeholderTextColor={COLORS.textSecondary}
          />

          <Select
            label="Županija"
            placeholder="Odaberi županiju"
            value={zupanija}
            onChange={(val) => {
              setZupanija(val);
              setMjesto('');
            }}
            options={countyOptions}
          />

          <Select
            label="Mjesto"
            placeholder={zupanija ? 'Odaberi mjesto' : 'Najprije odaberite županiju'}
            value={mjesto}
            onChange={setMjesto}
            options={placeOptions}
            disabled={!zupanija}
            searchable
          />

          <Text style={styles.label}>Adresa</Text>
          <TextInput style={styles.input} value={adresa} onChangeText={setAdresa} placeholder="npr. Ilica 1" placeholderTextColor={COLORS.textSecondary} />

          <Text style={styles.label}>Telefon</Text>
          <TextInput style={styles.input} value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" placeholder="+385..." placeholderTextColor={COLORS.textSecondary} />

          <TouchableOpacity style={styles.gpsBtn} onPress={useCurrentLocation}>
            <Text style={styles.gpsBtnText}>
              📍 {lat && lng ? `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} (promijeni)` : 'Postavi GPS na trenutnu lokaciju'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Sadržaji</Text>
          <View style={styles.chips}>
            {SADRZAJI.map((s) => (
              <Pressable
                key={s.value}
                style={[styles.chip, sadrzaji.includes(s.value) && styles.chipActive]}
                onPress={() => toggleSadrzaj(s.value)}
              >
                <Text style={[styles.chipText, sadrzaji.includes(s.value) && styles.chipTextActive]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Radno vrijeme (prazno = zatvoreno)</Text>
          {DANI.map((dan) => {
            const rv = radnoVrijeme[dan.key] ?? { od: '', do: '' };
            return (
              <View key={dan.key} style={styles.radnoRow}>
                <Text style={styles.radnoDan}>{dan.label}</Text>
                <TextInput
                  style={styles.radnoInput}
                  value={rv?.od ?? ''}
                  onChangeText={(v) => setRadno(dan.key, 'od', v)}
                  placeholder="08:00"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <Text style={{ color: COLORS.textSecondary }}>–</Text>
                <TextInput
                  style={styles.radnoInput}
                  value={rv?.do ?? ''}
                  onChangeText={(v) => setRadno(dan.key, 'do', v)}
                  placeholder="22:00"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            );
          })}

          <View style={styles.switchRow}>
            <Text style={styles.label}>Primam rezervacije stola</Text>
            <Switch
              value={rezervacije}
              onValueChange={setRezervacije}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
            />
          </View>

          <Text style={styles.label}>Broj stolova</Text>
          <TextInput
            style={styles.input}
            value={brojStolova}
            onChangeText={setBrojStolova}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={COLORS.textSecondary}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>QR kodovi za naručivanje</Text>
            <Switch
              value={qrNarudzbe}
              onValueChange={setQrNarudzbe}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{isEdit ? 'Spremi promjene' : 'Kreiraj objekt'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  coverPicker: {
    height: 150,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPickerText: { color: COLORS.primaryDark, fontWeight: '600' },
  label: { fontSize: FONT.small, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT.body,
    color: COLORS.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    backgroundColor: COLORS.card,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.small, color: COLORS.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  dropdown: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  dropdownItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  gpsBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  gpsBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONT.small },
  radnoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  radnoDan: { width: 100, fontSize: FONT.small, color: COLORS.text },
  radnoInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontSize: FONT.small,
    color: COLORS.text,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.body },
});
