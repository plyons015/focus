import type { DeadlineRow } from '../domain/deadlines';
import { planNotices, type NoticePrefs } from '../domain/notices';

export async function applyNotices(rows: DeadlineRow[], prefs: NoticePrefs, now = new Date()): Promise<void> {
  const enabled = prefs.atTime || prefs.before15 || prefs.before60 || prefs.morningOf || prefs.eveningBefore;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  if (!enabled) {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel(pending);
    return;
  }
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return;
  try {
    await LocalNotifications.createChannel({
      id: 'zigzag',
      name: 'ZigZag',
      description: 'Dated items',
      importance: 4,
    });
  } catch {
    // The browser has no notification channel.
  }
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel(pending);
  const planned = planNotices(rows, now, prefs).filter((item) => item.at.getTime() > Date.now() + 5000);
  if (!planned.length) return;
  await LocalNotifications.schedule({
    notifications: planned.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      channelId: 'zigzag',
      schedule: { at: item.at, allowWhileIdle: true },
    })),
  });
}
