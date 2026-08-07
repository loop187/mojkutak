import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import MenuSection from '../../components/MenuSection';
import PostCard from '../../components/PostCard';
import RatingStars from '../../components/RatingStars';
import ReviewCard from '../../components/ReviewCard';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { DANI, sadrzajLabel, tipLabel } from '../../constants/options';
import { apiErrorMessage } from '../../services/api';
import { addFavorite, removeFavorite } from '../../services/favorites';
import { getVenuePosts } from '../../services/posts';
import { createReservation, getAvailableTables } from '../../services/reservations';
import { createReview, getVenueReviews } from '../../services/reviews';
import { MenuCategory, Post, Review, Venue } from '../../services/types';
import { getVenue, getVenueMenu } from '../../services/venues';
import { useAuthStore } from '../../store/useAuthStore';
import { Select } from '../../components/Select';

type TabKey = 'info' | 'meni' | 'objave' | 'recenzije';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<TabKey>('info');
  const [isFavorite, setIsFavorite] = useState(false);

  // Rezervacija
  const [reserveVisible, setReserveVisible] = useState(false);
  const [resDate, setResDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [brojOsoba, setBrojOsoba] = useState('2');
  const [napomena, setNapomena] = useState('');
  const [stol, setStol] = useState('');
  const [slobodniStolovi, setSlobodniStolovi] = useState<number[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [reserving, setReserving] = useState(false);

  // Recenzija
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const v = await getVenue(id);
      setVenue(v);
      setIsFavorite(!!v.isFavorite);
      const [m, p, r] = await Promise.all([
        getVenueMenu(id),
        getVenuePosts(id),
        getVenueReviews(id),
      ]);
      setMenu(m);
      setPosts(p);
      setReviews(r);
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Dohvati slobodne stolove kad se promijeni datum ili vrijeme
  useEffect(() => {
    if (!venue || !venue.brojStolova) return;
    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const datum = resDate.toISOString().slice(0, 10);
        const vrijeme = `${String(resDate.getHours()).padStart(2, '0')}:${String(resDate.getMinutes()).padStart(2, '0')}`;
        const { slobodni } = await getAvailableTables(venue.id, datum, vrijeme);
        setSlobodniStolovi(slobodni);
        if (stol && !slobodni.includes(parseInt(stol, 10))) setStol('');
      } catch {
        setSlobodniStolovi([]);
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
  }, [resDate, venue?.brojStolova]);

  if (!venue) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isOwnVenue = user?.id === venue.ownerId;

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFavorite(venue.id);
        setIsFavorite(false);
      } else {
        await addFavorite(venue.id);
        setIsFavorite(true);
      }
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  };

  const handleReserve = async () => {
    const broj = parseInt(brojOsoba, 10);
    const stolBroj = parseInt(stol, 10);
    if (!broj || broj < 1) {
      Alert.alert('Greška', 'Unesite ispravan broj osoba');
      return;
    }
    if (!stolBroj || stolBroj < 1) {
      Alert.alert('Greška', 'Odaberite stol');
      return;
    }
    setReserving(true);
    try {
      const datum = resDate.toISOString().slice(0, 10);
      const vrijeme = `${String(resDate.getHours()).padStart(2, '0')}:${String(resDate.getMinutes()).padStart(2, '0')}`;
      await createReservation(venue.id, { datum, vrijeme, brojOsoba: broj, stol: stolBroj, napomena });
      setReserveVisible(false);
      setNapomena('');
      setStol('');
      Alert.alert('Uspjeh', 'Rezervacija poslana! Dobit ćete obavijest kada ju ugostitelj potvrdi.');
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setReserving(false);
    }
  };

  const handleReview = async () => {
    if (myRating < 1) {
      Alert.alert('Greška', 'Odaberite ocjenu (1-5 zvjezdica)');
      return;
    }
    setSubmittingReview(true);
    try {
      await createReview(venue.id, myRating, myComment);
      setMyRating(0);
      setMyComment('');
      load();
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setSubmittingReview(false);
    }
  };

  const alreadyReviewed = reviews.some((r) => r.userId === user?.id);

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
              <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
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
                {venue.naziv}
              </Text>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {venue.coverPhoto ? (
          <Image source={{ uri: venue.coverPhoto }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={{ fontSize: 56 }}>☕</Text>
          </View>
        )}

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{venue.naziv}</Text>
            <Text style={styles.subtitle}>{tipLabel(venue.tip)} · {venue.mjesto || '—'}</Text>
            <View style={styles.ratingRow}>
              <RatingStars rating={venue.ratingAvg} />
              <Text style={styles.ratingText}>
                {venue.ratingCount > 0 ? `${venue.ratingAvg.toFixed(1)} (${venue.ratingCount})` : 'Bez ocjena'}
              </Text>
            </View>
          </View>
          {!isOwnVenue && (
            <TouchableOpacity style={styles.favBtn} onPress={toggleFavorite}>
              <Text style={{ fontSize: 26 }}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {venue.rezervacijeUkljucene && !isOwnVenue && (
          <TouchableOpacity style={styles.reserveBtn} onPress={() => setReserveVisible(true)}>
            <Text style={styles.reserveBtnText}>📅 Rezerviraj stol</Text>
          </TouchableOpacity>
        )}

        <View style={styles.tabs}>
          {([
            ['info', 'Info'],
            ['meni', 'Meni'],
            ['objave', 'Objave'],
            ['recenzije', 'Recenzije'],
          ] as const).map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.content}>
          {tab === 'info' && (
            <View>
              {!!venue.opis && <Text style={styles.opis}>{venue.opis}</Text>}

              {!!venue.adresa && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📍 Adresa</Text>
                  <Text style={styles.infoValue}>{venue.adresa}, {venue.mjesto}</Text>
                </View>
              )}
              {!!venue.telefon && (
                <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${venue.telefon}`)}>
                  <Text style={styles.infoLabel}>📞 Telefon</Text>
                  <Text style={[styles.infoValue, { color: COLORS.primary }]}>{venue.telefon}</Text>
                </TouchableOpacity>
              )}

              {Object.keys(venue.radnoVrijeme || {}).length > 0 && (
                <View style={{ marginTop: SPACING.md }}>
                  <Text style={styles.sectionTitle}>Radno vrijeme</Text>
                  {DANI.map((dan) => {
                    const rv = venue.radnoVrijeme[dan.key];
                    return (
                      <View key={dan.key} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{dan.label}</Text>
                        <Text style={styles.infoValue}>
                          {rv && rv.od ? `${rv.od} – ${rv.do}` : 'Zatvoreno'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {venue.sadrzaji.length > 0 && (
                <View style={{ marginTop: SPACING.md }}>
                  <Text style={styles.sectionTitle}>Sadržaji</Text>
                  <View style={styles.chips}>
                    {venue.sadrzaji.map((s) => (
                      <View key={s} style={styles.chip}>
                        <Text style={styles.chipText}>{sadrzajLabel(s)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {tab === 'meni' && (
            menu.length > 0 ? (
              menu.map((cat) => <MenuSection key={cat.id} category={cat} />)
            ) : (
              <Text style={styles.empty}>Meni još nije unesen.</Text>
            )
          )}

          {tab === 'objave' && (
            posts.length > 0 ? (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            ) : (
              <Text style={styles.empty}>Nema aktivnih objava.</Text>
            )
          )}

          {tab === 'recenzije' && (
            <View>
              {!isOwnVenue && !alreadyReviewed && (
                <View style={styles.reviewForm}>
                  <Text style={styles.sectionTitle}>Napiši recenziju</Text>
                  <RatingStars rating={myRating} size={30} onRate={setMyRating} />
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Komentar (opcionalno)"
                    placeholderTextColor={COLORS.textSecondary}
                    multiline
                    value={myComment}
                    onChangeText={setMyComment}
                  />
                  <TouchableOpacity style={styles.reserveBtn} onPress={handleReview} disabled={submittingReview}>
                    {submittingReview ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.reserveBtnText}>Objavi recenziju</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              {reviews.length > 0 ? (
                reviews.map((r) => <ReviewCard key={r.id} review={r} />)
              ) : (
                <Text style={styles.empty}>Još nema recenzija. Budi prvi!</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal rezervacije */}
      <Modal visible={reserveVisible} transparent animationType="slide" onRequestClose={() => setReserveVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Rezervacija — {venue.naziv}</Text>

            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.pickerBtnText}>
                📅 {resDate.getDate()}.{resDate.getMonth() + 1}.{resDate.getFullYear()}.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.pickerBtnText}>
                🕐 {String(resDate.getHours()).padStart(2, '0')}:{String(resDate.getMinutes()).padStart(2, '0')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={resDate}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setResDate(date);
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={resDate}
                mode="time"
                is24Hour
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                onChange={(_, date) => {
                  setShowTimePicker(false);
                  if (date) setResDate(date);
                }}
              />
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="Broj osoba"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
              value={brojOsoba}
              onChangeText={setBrojOsoba}
            />

            <Select
              label="Odaberite stol"
              placeholder={loadingTables ? 'Učitavanje stolova...' : 'Odaberite stol'}
              options={slobodniStolovi.map((s) => ({ label: `Stol ${s}`, value: String(s) }))}
              value={stol}
              onChange={setStol}
              disabled={loadingTables || slobodniStolovi.length === 0}
            />

            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              placeholder="Napomena (opcionalno)"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              value={napomena}
              onChangeText={setNapomena}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setReserveVisible(false)}>
                <Text style={styles.btnSecondaryText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleReserve} disabled={reserving}>
                {reserving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnPrimaryText}>Rezerviraj</Text>}
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  cover: { width: '100%', height: 200 },
  coverPlaceholder: { backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', padding: SPACING.md, alignItems: 'flex-start' },
  title: { fontSize: FONT.title, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: FONT.body, color: COLORS.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  ratingText: { fontSize: FONT.small, color: COLORS.textSecondary },
  favBtn: { padding: SPACING.xs },
  reserveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  reserveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.body },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center' },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONT.small, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { padding: SPACING.md },
  opis: { fontSize: FONT.body, color: COLORS.text, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { color: COLORS.textSecondary, fontSize: FONT.body },
  infoValue: { color: COLORS.text, fontSize: FONT.body, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  chipText: { fontSize: FONT.small, color: COLORS.primaryDark, fontWeight: '600' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
  reviewForm: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    minHeight: 60,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  modalTitle: { fontSize: FONT.subtitle, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  pickerBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  pickerBtnText: { fontSize: FONT.body, color: COLORS.text },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    textAlignVertical: 'top',
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
