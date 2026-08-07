import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let navigationListenerSet = false;

/**
 * Obradi klik na push notifikaciju i navigiraj na pripadajući ekran.
 */
function handleNotificationResponse(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const data = (response.notification.request.content.data || {}) as Record<string, any>;
  const venueId = data.venueId as string | undefined;
  const type = data.type as string | undefined;

  if (venueId) {
    // Push vlasniku ide na owner ekran s rezervacijama,
    // gostu na javni profil objekta.
    const ownerTypes = ['reservation_created', 'reservation_cancelled'];
    const path = ownerTypes.includes(type)
      ? `/owner/venue/${venueId}`
      : `/venues/${venueId}`;
    router.push(path);
  }
}

/**
 * Postavi listener za klikove na push notifikacije i obradi zadnju
 * notifikaciju koja je otvorila aplikaciju.
 */
export function listenToPushNotifications(): void {
  if (navigationListenerSet) return;
  navigationListenerSet = true;

  if (Platform.OS === 'web') {
    // Push notifikacije nisu podržane na webu bez VAPID konfiguracije
    return;
  }

  // Klik na notifikaciju dok je app pokrenut
  Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationResponse(response);
  });

  // Ako je app otvoren klikom na notifikaciju (cold start)
  Notifications.getLastNotificationResponseAsync().then((response) => {
    handleNotificationResponse(response);
  });
}

/**
 * Registrira Expo push token na backend.
 * Poziva se nakon uspješnog logina.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MojKutak',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (token) {
      await api.post('/users/device-token', { token, platform: Platform.OS });
    }
  } catch (e) {
    // Push nije kritičan — ne ruši app
    console.warn('[push] Registracija nije uspjela:', e);
  }
}
