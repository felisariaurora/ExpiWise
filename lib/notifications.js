import * as Notifications from 'expo-notifications';
import { isoToDate } from './dates';
import { formatDate } from './dates';

const PREFIX = 'expiwise-expiry-';
const NOTIFY_HOUR = 9; // orario in cui arriva l'avviso

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function notificationIdFor(productId) {
  return `${PREFIX}${productId}`;
}

function triggerDateFor(expiryDate, threshold) {
  const target = isoToDate(expiryDate);
  target.setDate(target.getDate() - threshold);
  target.setHours(NOTIFY_HOUR, 0, 0, 0);
  return target;
}

// Riprogramma da zero tutti gli avvisi di scadenza in base ai prodotti e alla
// soglia correnti: più semplice e affidabile che calcolare le differenze.
export async function syncExpiryNotifications(products, threshold) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((n) => n.identifier?.startsWith(PREFIX));
  await Promise.all(ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));

  const withExpiry = products.filter((p) => p.expiryDate);
  await Promise.all(
    withExpiry.map((p) => {
      const triggerDate = triggerDateFor(p.expiryDate, threshold ?? 3);
      if (triggerDate.getTime() <= Date.now()) return null;
      return Notifications.scheduleNotificationAsync({
        identifier: notificationIdFor(p.id),
        content: {
          title: 'In scadenza',
          body: `${p.name} scade il ${formatDate(p.expiryDate)}`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    })
  );
}
