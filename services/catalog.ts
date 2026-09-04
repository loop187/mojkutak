import api from './api';
import { CatalogItem } from './types';

export interface CatalogListResponse {
  items: CatalogItem[];
  total: number;
  page: number;
  per_page: number;
  totalPages: number;
}

export interface CatalogFilters {
  source?: 'drink' | 'food';
  search?: string;
  category?: string;
  page?: number;
  per_page?: number;
}

export async function getCatalogItems(filters: CatalogFilters = {}): Promise<CatalogListResponse> {
  const params: Record<string, string | number> = {};
  if (filters.source) params.source = filters.source;
  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  params.page = filters.page ?? 1;
  params.per_page = filters.per_page ?? 50;

  const { data } = await api.get<CatalogListResponse>('/catalog', { params });
  return data;
}

export interface CatalogCategory {
  category: string;
  itemCount: number;
}

export async function getCatalogCategories(source: 'drink' | 'food', search?: string): Promise<CatalogCategory[]> {
  const params: Record<string, string> = { source };
  if (search) params.search = search;
  const { data } = await api.get<CatalogCategory[]>('/catalog/categories', { params });
  return data;
}

export async function addCatalogItemsToMenu(
  venueId: string,
  items: { catalogItemId: string; cijena: number }[]
): Promise<{ success: boolean; count: number }> {
  const { data } = await api.post<{ success: boolean; count: number }>(`/venues/${venueId}/menu/catalog`, { items });
  return data;
}
