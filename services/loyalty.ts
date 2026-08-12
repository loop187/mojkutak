import api from './api';

export interface LoyaltyReward {
  id: string;
  menuItemId: string;
  naziv: string;
  cijena: number;
  popust: number;
  bodovi: number;
}

export interface MyVenueLoyalty {
  bodovi: number;
  bodoviPoEuru: number;
  rewards: LoyaltyReward[];
}

export interface LoyaltyBalance {
  venueId: string;
  venueNaziv: string;
  mjesto: string;
  bodovi: number;
}

export async function getVenueRewards(venueId: string): Promise<LoyaltyReward[]> {
  const { data } = await api.get<LoyaltyReward[]>(`/venues/${venueId}/loyalty/rewards`);
  return data;
}

export async function addVenueReward(
  venueId: string,
  input: { menuItemId: string; popust: number; bodovi: number }
): Promise<LoyaltyReward[]> {
  const { data } = await api.post<LoyaltyReward[]>(`/venues/${venueId}/loyalty/rewards`, input);
  return data;
}

export async function deleteReward(rewardId: string): Promise<void> {
  await api.delete(`/loyalty/rewards/${rewardId}`);
}

export async function getMyVenueLoyalty(venueId: string): Promise<MyVenueLoyalty | null> {
  try {
    const { data } = await api.get<MyVenueLoyalty>(`/venues/${venueId}/loyalty/me`);
    return data;
  } catch {
    return null;
  }
}

export async function getMyLoyaltyBalances(): Promise<LoyaltyBalance[]> {
  const { data } = await api.get<LoyaltyBalance[]>('/loyalty/my');
  return data;
}
