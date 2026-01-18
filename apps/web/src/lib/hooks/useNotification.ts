/**
 * Notification Hook
 * Handles browser notification permissions and displaying notifications
 */

import { useCallback, useEffect, useState } from "react";

type NotificationPermission = "default" | "granted" | "denied";

export function useNotification() {
	const [permission, setPermission] =
		useState<NotificationPermission>("default");
	const [supported, setSupported] = useState(false);

	// Check if notifications are supported
	useEffect(() => {
		setSupported("Notification" in window);
		if ("Notification" in window) {
			setPermission(Notification.permission);
		}
	}, []);

	// Request notification permission
	const requestPermission =
		useCallback(async (): Promise<NotificationPermission> => {
			if (!("Notification" in window)) {
				console.warn("[useNotification] Notifications not supported");
				return "denied";
			}

			if (Notification.permission === "granted") {
				setPermission("granted");
				return "granted";
			}

			if (Notification.permission !== "denied") {
				const result = await Notification.requestPermission();
				setPermission(result);
				return result;
			}

			return "denied";
		}, []);

	// Show notification
	const showNotification = useCallback(
		async (title: string, options?: NotificationOptions) => {
			if (!supported || permission !== "granted") {
				console.warn("[useNotification] Cannot show notification:", {
					supported,
					permission,
				});
				return;
			}

      const notificationOptions = {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        ...options,
      };

      // Try using service worker first (required for mobile Chrome)
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, notificationOptions as any);
          return;
        } catch (error) {
          console.error('[useNotification] Service worker notification failed:', error);
          // Fallback to regular notification
        }
      }

      // Fallback to regular Notification API (for desktop browsers)
      try {
        const notification = new Notification(title, notificationOptions as any);
        // Auto-close after 5 seconds (only works with regular Notification)
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('[useNotification] Notification API failed:', error);
      }
		},
		[supported, permission],
	);

  // Show timer completion notification
  const showTimerCompleteNotification = useCallback(
    (cardTitle: string, duration: number) => {
      const minutes = Math.floor(duration / 60);
      const message = minutes > 0
        ? `Anda telah fokus selama ${minutes} menit.`
        : 'Sesi fokus selesai.';

      return showNotification(`Fokus Selesai: ${cardTitle}`, {
        body: message,
        tag: 'timer-complete',
        requireInteraction: false,
      });
    },
    [showNotification]
  );

	return {
		supported,
		permission,
		requestPermission,
		showNotification,
		showTimerCompleteNotification,
	};
}
