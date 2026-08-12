import api from './api';

export interface OrderItemInput {
  menuItemId: string;
  kolicina: number;
}

export interface Order {
  id: number;
  tip: 'stol' | 'dostava';
  brojStola: number;
  adresa: string | null;
  telefon: string | null;
  status: string;
  ukupno: number;
  napomena?: string;
  items: {
    id: number;
    menuItemId: number;
    naziv: string;
    kolicina: number;
    cijena: number;
  }[];
  createdAt: string;
}

export async function createOrder(
  code: string,
  items: OrderItemInput[],
  napomena?: string,
  rewardId?: string
): Promise<{ orderId: number }> {
  const { data } = await api.post<{ orderId: number }>('/orders', { code, items, napomena, rewardId });
  return data;
}

export async function createDeliveryOrder(
  venueId: string,
  items: OrderItemInput[],
  adresa: string,
  telefon: string,
  napomena?: string,
  rewardId?: string
): Promise<{ orderId: number }> {
  const { data } = await api.post<{ orderId: number }>('/orders', {
    tip: 'dostava',
    venueId,
    items,
    adresa,
    telefon,
    napomena,
    rewardId,
  });
  return data;
}

export async function getOwnerOrders(venueId: string): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/owner/orders', { params: { venueId } });
  return data;
}

export async function markOrderDone(orderId: number): Promise<void> {
  await api.post(`/orders/${orderId}/done`);
}
