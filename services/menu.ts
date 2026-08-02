import api from './api';
import { MenuCategory, MenuItem } from './types';

export async function createCategory(venueId: string, naziv: string, redoslijed = 0): Promise<MenuCategory> {
  const { data } = await api.post<MenuCategory>(`/venues/${venueId}/menu/categories`, { naziv, redoslijed });
  return data;
}

export async function updateCategory(id: string, input: { naziv?: string; redoslijed?: number }): Promise<MenuCategory> {
  const { data } = await api.put<MenuCategory>(`/menu/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/menu/categories/${id}`);
}

export interface MenuItemInput {
  naziv?: string;
  categoryId?: string;
  opis?: string;
  cijena?: number;
  dostupno?: boolean;
  redoslijed?: number;
}

export async function createItem(venueId: string, input: MenuItemInput): Promise<MenuItem> {
  const { data } = await api.post<MenuItem>(`/venues/${venueId}/menu/items`, input);
  return data;
}

export async function updateItem(id: string, input: MenuItemInput): Promise<MenuItem> {
  const { data } = await api.put<MenuItem>(`/menu/items/${id}`, input);
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/menu/items/${id}`);
}
