/**
 * Capacitor platform detection and bridge utilities.
 *
 * This module provides a unified interface for platform-specific functionality
 * (camera, notifications) that works both in web browser and in Capacitor
 * (native Android) environments.
 *
 * When running inside Capacitor, it delegates to native plugins:
 *   - @capacitor/camera for photo capture (US-2)
 *   - @capacitor/local-notifications for scheduled reminders (US-9)
 *
 * When running in a web browser, it falls back to standard web APIs:
 *   - <input type="file" accept="image/*" capture="environment"> for camera
 *   - Browser Notification API for notifications
 */

/**
 * Detect if the app is running inside a Capacitor native container.
 * Uses the Capacitor global that is injected by the native bridge.
 */
export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!(capacitor && typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform());
}

/**
 * Get the current platform name.
 * @returns "android" | "ios" | "web"
 */
export function getPlatform(): "android" | "ios" | "web" {
  if (typeof window === "undefined") return "web";
  const capacitor = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  if (capacitor && typeof capacitor.getPlatform === "function") {
    return capacitor.getPlatform() as "android" | "ios" | "web";
  }
  return "web";
}

/**
 * Take a photo using the device camera.
 *
 * On native (Capacitor): uses @capacitor/camera plugin to invoke the native camera.
 * On web: returns null — the caller should use <input type="file" capture> instead.
 *
 * @returns A base64 data URL of the captured photo, or null if on web.
 */
export async function takePhoto(): Promise<string | null> {
  if (!isNative()) {
    return null;
  }

  try {
    // Dynamic import to avoid bundling native plugin in web-only builds
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");

    // Explicitly request camera permission before opening the camera.
    // This gives a clearer error flow than relying on getPhoto's implicit request.
    const permResult = await Camera.requestPermissions();
    if (permResult.camera !== "granted") {
      return null;
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return image.dataUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Request camera permission (native only).
 * On web, camera permission is handled by the browser when the input is used.
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (!isNative()) return true;

  try {
    const { Camera } = await import("@capacitor/camera");
    const result = await Camera.requestPermissions();
    return result.camera === "granted";
  } catch {
    return false;
  }
}

/**
 * Schedule a local notification.
 *
 * On native (Capacitor): uses @capacitor/local-notifications to schedule a
 * notification at a specific time.
 * On web: uses the Browser Notification API (requires user permission).
 *
 * @param id - Unique notification ID
 * @param title - Notification title
 * @param body - Notification body text
 * @param scheduledAt - Date/time to fire the notification
 */
export async function scheduleNotification(
  id: number,
  title: string,
  body: string,
  scheduledAt: Date,
): Promise<void> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: {
              at: scheduledAt,
              every: undefined,
              count: 1,
            },
          },
        ],
      });
    } catch {
      // Silently fail — notifications are a nice-to-have
    }
  } else {
    // Web fallback: request permission and show notification at scheduled time
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      const delay = scheduledAt.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          new Notification(title, { body });
        }, delay);
      }
    }
  }
}

/**
 * Cancel a scheduled notification by ID.
 */
export async function cancelNotification(id: number): Promise<void> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({
        notifications: [{ id }],
      });
    } catch {
      // Silently fail
    }
  }
  // Web: no way to cancel setTimeout-based notifications without tracking IDs
}

/**
 * Cancel multiple scheduled notifications by IDs.
 */
export async function cancelNotifications(ids: number[]): Promise<void> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({
        notifications: ids.map((id) => ({ id })),
      });
    } catch {
      // Silently fail
    }
  }
}

/**
 * Request notification permission (native only).
 * On web, permission is requested lazily when scheduling.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    } catch {
      return false;
    }
  }

  if (!("Notification" in window)) return false;
  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  return Notification.permission === "granted";
}
