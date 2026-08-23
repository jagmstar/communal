/**
 * Local notification scheduling for meter reading reminders (US-9).
 *
 * Schedules 3 notifications per meter deadline:
 *   1. 3 days before deadline (AC-9.1)
 *   2. 1 day before deadline
 *   3. Day of deadline
 * All at 09:00 local time (AC-9.2).
 *
 * On native Android (Capacitor): delegates to @capacitor/local-notifications.
 * On web: uses Browser Notification API with setTimeout.
 */

import type { Meter, NotificationSettings, UserSettings } from "./types";
import {
  scheduleNotification,
  cancelNotifications,
  requestNotificationPermission,
} from "./capacitor";

/** Default notification time: 09:00 local (AC-9.2) */
const NOTIFICATION_HOUR = 9;
const NOTIFICATION_MINUTE = 0;

/** Notification type identifiers for ID generation */
const NOTIFICATION_TYPES = {
  THREE_DAYS: 1000,
  ONE_DAY: 2000,
  DAY_OF: 3000,
} as const;

/**
 * Generate a deterministic notification ID from meter ID and type offset.
 * This ensures stable IDs across re-scheduling (cancel + re-schedule).
 */
function generateNotificationId(meterId: string, typeOffset: number): number {
  // Hash the meter ID to a number and add the type offset
  let hash = 0;
  for (let i = 0; i < meterId.length; i++) {
    hash = (hash << 5) - hash + meterId.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash % 1000) + typeOffset;
}

/**
 * Calculate the next deadline date for a meter.
 * The deadline is on the `submitDeadlineDay` of the current month
 * (or next month if the day has already passed).
 */
function getNextDeadline(meter: Meter): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Try this month's deadline
  let deadline = new Date(year, month, meter.submitDeadlineDay, NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0, 0);

  // If the deadline has already passed, use next month
  if (deadline <= now) {
    deadline = new Date(year, month + 1, meter.submitDeadlineDay, NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0, 0);
  }

  return deadline;
}

/**
 * Format the notification body text (AC-9.4).
 * Format: "{serviceName} — передати показники до {date}"
 */
function formatNotificationBody(meter: Meter, deadline: Date): string {
  const formattedDate = deadline.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
  });
  return `${meter.serviceName} — передати показники до ${formattedDate}`;
}

/**
 * Schedule all notifications for a single meter (AC-9.3).
 *
 * Schedules 3 notifications:
 *   - 3 days before deadline at 09:00
 *   - 1 day before deadline at 09:00
 *   - Day of deadline at 09:00
 *
 * @param meter The meter to schedule reminders for
 * @param settings User notification settings (only schedules if reading is enabled)
 * @returns Array of scheduled notification IDs (for later cancellation)
 */
export async function scheduleNotifications(
  meter: Meter,
  settings?: NotificationSettings,
): Promise<number[]> {
  // Check if reading notifications are enabled
  if (settings && !settings.reading) {
    return [];
  }

  // Request permission first
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return [];
  }

  const deadline = getNextDeadline(meter);
  const body = formatNotificationBody(meter, deadline);
  const serviceName = meter.serviceName;

  const ids: number[] = [];

  // 1. Three days before deadline
  const threeDaysBefore = new Date(deadline);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  if (threeDaysBefore > new Date()) {
    const id = generateNotificationId(meter.id, NOTIFICATION_TYPES.THREE_DAYS);
    await scheduleNotification(
      id,
      `Нагадування: ${serviceName}`,
      body,
      threeDaysBefore,
    );
    ids.push(id);
  }

  // 2. One day before deadline
  const oneDayBefore = new Date(deadline);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  if (oneDayBefore > new Date()) {
    const id = generateNotificationId(meter.id, NOTIFICATION_TYPES.ONE_DAY);
    await scheduleNotification(
      id,
      `Нагадування: ${serviceName}`,
      body,
      oneDayBefore,
    );
    ids.push(id);
  }

  // 3. Day of deadline
  if (deadline > new Date()) {
    const id = generateNotificationId(meter.id, NOTIFICATION_TYPES.DAY_OF);
    await scheduleNotification(
      id,
      `Сьогодні дедлайн: ${serviceName}`,
      body,
      deadline,
    );
    ids.push(id);
  }

  return ids;
}

/**
 * Cancel all scheduled notifications for a specific meter (AC-9.6).
 *
 * @param meterId The meter ID to cancel notifications for
 */
export async function cancelNotificationsForMeter(meterId: string): Promise<void> {
  const ids = [
    generateNotificationId(meterId, NOTIFICATION_TYPES.THREE_DAYS),
    generateNotificationId(meterId, NOTIFICATION_TYPES.ONE_DAY),
    generateNotificationId(meterId, NOTIFICATION_TYPES.DAY_OF),
  ];
  await cancelNotifications(ids);
}

/**
 * Update notification settings (AC-9.5, AC-9.6, AC-9.7).
 *
 * When a toggle is turned OFF: cancel all notifications of that type.
 * When a toggle is turned ON: schedule notifications for all upcoming deadlines.
 *
 * @param settings The new notification settings
 * @param meters All meters to schedule/cancel for
 */
export async function updateNotificationSettings(
  settings: NotificationSettings,
  meters: Meter[],
): Promise<void> {
  if (settings.reading) {
    // Schedule for all meters (AC-9.7)
    for (const meter of meters) {
      await scheduleNotifications(meter, settings);
    }
  } else {
    // Cancel all reading notifications (AC-9.6)
    for (const meter of meters) {
      await cancelNotificationsForMeter(meter.id);
    }
  }

  // Payment, tariff, and anomaly notifications would be handled here
  // when those features are implemented. For now, they are toggles only.
}

/**
 * Schedule notifications for all meters at once.
 * Useful for app startup or after settings load.
 */
export async function scheduleAllNotifications(
  meters: Meter[],
  settings: NotificationSettings,
): Promise<void> {
  if (!settings.reading) return;

  for (const meter of meters) {
    await scheduleNotifications(meter, settings);
  }
}

/**
 * Load notification settings from localStorage (web fallback when API not ready).
 */
export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") {
    return { reading: true, payment: true, tariff: false, anomaly: true };
  }

  try {
    const stored = localStorage.getItem("communal-notification-settings");
    if (stored) {
      return JSON.parse(stored) as NotificationSettings;
    }
  } catch {
    // Ignore parse errors
  }

  return { reading: true, payment: true, tariff: false, anomaly: true };
}

/**
 * Save notification settings to localStorage (web fallback).
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("communal-notification-settings", JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load full user settings from localStorage (web fallback).
 */
export function loadUserSettings(): UserSettings {
  const defaults: UserSettings = {
    epsUsername: null,
    epsAccountNumber: "2099000225595",
    epsConnected: false,
    notification: { reading: true, payment: true, tariff: false, anomaly: true },
    userName: "Роман Крепич",
    userAddress: "вул. Карпенка 18а/76, Тернопіль",
  };

  if (typeof window === "undefined") return defaults;

  try {
    const stored = localStorage.getItem("communal-user-settings");
    if (stored) {
      return { ...defaults, ...JSON.parse(stored) } as UserSettings;
    }
  } catch {
    // Ignore parse errors
  }

  return defaults;
}

/**
 * Save full user settings to localStorage (web fallback).
 */
export function saveUserSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("communal-user-settings", JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}
