import api from './api';

export interface StaffMember {
  userId: string;
  naziv: string;
  email: string;
  photoUrl: string | null;
  uSmjeni: boolean;
  dodanAt: string;
}

export interface Workplace {
  venueId: string;
  venueNaziv: string;
  mjesto: string;
  coverPhoto: string | null;
  uSmjeni: boolean;
}

export async function getVenueStaff(venueId: string): Promise<StaffMember[]> {
  const { data } = await api.get<StaffMember[]>(`/venues/${venueId}/staff`);
  return data;
}

export async function addVenueStaff(venueId: string, email: string): Promise<StaffMember> {
  const { data } = await api.post<StaffMember>(`/venues/${venueId}/staff`, { email });
  return data;
}

export async function removeVenueStaff(venueId: string, userId: string): Promise<void> {
  await api.delete(`/venues/${venueId}/staff/${userId}`);
}

export async function getMyWorkplaces(): Promise<Workplace[]> {
  const { data } = await api.get<Workplace[]>('/staff/my');
  return data;
}

export async function setShift(venueId: string, uSmjeni: boolean): Promise<void> {
  await api.post('/staff/shift', { venueId, uSmjeni });
}
