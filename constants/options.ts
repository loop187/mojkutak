export const VENUE_TIPOVI = [
  { value: 'kafic', label: 'Kafić' },
  { value: 'restoran', label: 'Restoran' },
  { value: 'pizzeria', label: 'Pizzeria' },
  { value: 'fast_food', label: 'Fast food' },
  { value: 'slasticarnica', label: 'Slastičarnica' },
  { value: 'pub', label: 'Pub' },
  { value: 'klub', label: 'Klub' },
  { value: 'ostalo', label: 'Ostalo' },
] as const;

export const SADRZAJI = [
  { value: 'terasa', label: 'Terasa' },
  { value: 'parking', label: 'Parking' },
  { value: 'pet_friendly', label: 'Pet friendly' },
  { value: 'djecji_kutak', label: 'Dječji kutak' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'kartice', label: 'Kartice' },
  { value: 'dostava', label: 'Dostava' },
  { value: 'pusacka_zona', label: 'Pušačka zona' },
  { value: 'live_glazba', label: 'Live glazba' },
  { value: 'tv_prijenosi', label: 'TV prijenosi' },
] as const;

export const POST_TIPOVI = [
  { value: 'ponuda', label: 'Ponuda' },
  { value: 'event', label: 'Event' },
  { value: 'obavijest', label: 'Obavijest' },
] as const;

export const ZUPANIJE = [
  'Zagrebačka',
  'Krapinsko-zagorska',
  'Sisačko-moslavačka',
  'Karlovačka',
  'Varaždinska',
  'Koprivničko-križevačka',
  'Bjelovarsko-bilogorska',
  'Primorsko-goranska',
  'Ličko-senjska',
  'Virovitičko-podravska',
  'Požeško-slavonska',
  'Brodsko-posavska',
  'Zadarska',
  'Osječko-baranjska',
  'Šibensko-kninska',
  'Vukovarsko-srijemska',
  'Splitsko-dalmatinska',
  'Istarska',
  'Dubrovačko-neretvanska',
  'Međimurska',
  'Grad Zagreb',
] as const;

export const DANI = [
  { key: 'pon', label: 'Ponedjeljak' },
  { key: 'uto', label: 'Utorak' },
  { key: 'sri', label: 'Srijeda' },
  { key: 'cet', label: 'Četvrtak' },
  { key: 'pet', label: 'Petak' },
  { key: 'sub', label: 'Subota' },
  { key: 'ned', label: 'Nedjelja' },
] as const;

export function tipLabel(value: string): string {
  return VENUE_TIPOVI.find((t) => t.value === value)?.label ?? value;
}

export function sadrzajLabel(value: string): string {
  return SADRZAJI.find((s) => s.value === value)?.label ?? value;
}

export function postTipLabel(value: string): string {
  return POST_TIPOVI.find((t) => t.value === value)?.label ?? value;
}
