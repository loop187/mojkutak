export type AppRole = 'owner' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: AppRole;
  naziv: string;
  phone: string;
  zupanija: string;
  mjesto: string;
  photoUrl: string | null;
  licenseUntil: string | null;
  licenseExpired: boolean;
  createdAt: string;
}

export interface RadnoVrijeme {
  [dan: string]: { od: string; do: string } | null;
}

export interface Venue {
  id: string;
  ownerId: string;
  ownerName: string | null;
  status: 'active' | 'hidden';
  naziv: string;
  tip: string;
  opis: string;
  zupanija: string;
  mjesto: string;
  adresa: string;
  lat: number | null;
  lng: number | null;
  telefon: string;
  radnoVrijeme: RadnoVrijeme;
  sadrzaji: string[];
  rezervacijeUkljucene: boolean;
  coverPhoto: string | null;
  gallery: string[];
  ratingAvg: number;
  ratingCount: number;
  distanceKm?: number | null;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  venueId: string;
  categoryId: string;
  naziv: string;
  opis: string;
  cijena: number;
  valuta: string;
  slika: string | null;
  dostupno: boolean;
  redoslijed: number;
}

export interface MenuCategory {
  id: string;
  venueId: string;
  naziv: string;
  redoslijed: number;
  items: MenuItem[];
}

export interface Post {
  id: string;
  venueId: string;
  venueNaziv: string | null;
  venueCover: string | null;
  tip: 'ponuda' | 'event' | 'obavijest';
  naslov: string;
  opis: string;
  slika: string | null;
  pocetak: string | null;
  kraj: string | null;
  aktivno: boolean;
  createdAt: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  venueId: string;
  venueNaziv: string | null;
  userId: string;
  userName: string | null;
  userPhone: string;
  status: ReservationStatus;
  datum: string;
  vrijeme: string;
  brojOsoba: number;
  napomena: string;
  odgovorUgostitelja: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  venueId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  ocjena: number;
  komentar: string;
  createdAt: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  licenseLength: string;
}

export interface LicenseProduct {
  productId: string;
  name: string;
  description: string;
  currency: string;
  variations: ProductVariation[];
}

export interface VenueListResponse {
  items: Venue[];
  total: number;
  page: number;
  totalPages: number;
}
