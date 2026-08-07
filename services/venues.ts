import api from './api';
import { MenuCategory, Venue, VenueListResponse } from './types';

export interface VenueFilters {
  tip?: string;
  zupanija?: string;
  mjesto?: string;
  search?: string;
  sadrzaji?: string[];
  lat?: number;
  lng?: number;
  radijus_km?: number;
  sort?: 'najnovije' | 'rating' | 'udaljenost';
  page?: number;
  per_page?: number;
}

export async function listVenues(filters: VenueFilters = {}): Promise<VenueListResponse> {
  const params: Record<string, string | number> = {};
  if (filters.tip) params.tip = filters.tip;
  if (filters.zupanija) params.zupanija = filters.zupanija;
  if (filters.mjesto) params.mjesto = filters.mjesto;
  if (filters.search) params.search = filters.search;
  if (filters.sadrzaji?.length) params.sadrzaji = JSON.stringify(filters.sadrzaji);
  if (filters.lat !== undefined) params.lat = filters.lat;
  if (filters.lng !== undefined) params.lng = filters.lng;
  if (filters.radijus_km) params.radijus_km = filters.radijus_km;
  if (filters.sort) params.sort = filters.sort;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;

  const { data } = await api.get<VenueListResponse>('/venues', { params });
  return data;
}

export async function getVenue(id: string): Promise<Venue> {
  const { data } = await api.get<Venue>(`/venues/${id}`);
  return data;
}

export async function getMyVenues(): Promise<Venue[]> {
  const { data } = await api.get<Venue[]>('/venues/my');
  return data;
}

export interface VenueInput {
  naziv?: string;
  tip?: string;
  opis?: string;
  zupanija?: string;
  mjesto?: string;
  adresa?: string;
  telefon?: string;
  lat?: number;
  lng?: number;
  radnoVrijeme?: Record<string, { od: string; do: string } | null>;
  sadrzaji?: string[];
  rezervacijeUkljucene?: boolean;
  brojStolova?: number;
  status?: 'active' | 'hidden';
}

export async function createVenue(input: VenueInput): Promise<Venue> {
  const { data } = await api.post<Venue>('/venues', input);
  return data;
}

export async function updateVenue(id: string, input: VenueInput): Promise<Venue> {
  const { data } = await api.put<Venue>(`/venues/${id}`, input);
  return data;
}

export async function deleteVenue(id: string): Promise<void> {
  await api.delete(`/venues/${id}`);
}

export async function uploadVenuePhoto(
  id: string,
  imageBase64: string,
  target: 'cover' | 'gallery' = 'cover',
  mime = 'image/jpeg'
): Promise<string> {
  const { data } = await api.post<{ photoUrl: string }>(`/venues/${id}/photo`, {
    imageBase64,
    mime,
    target,
  });
  return data.photoUrl;
}

export async function getVenueMenu(id: string): Promise<MenuCategory[]> {
  const { data } = await api.get<MenuCategory[]>(`/venues/${id}/menu`);
  return data;
}
