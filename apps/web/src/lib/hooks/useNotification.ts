/**
 * Notification Hook
 * Handles browser notification permissions and displaying notifications
 */

import { useEffect, useState, useCallback } from 'react';

type NotificationPermission = 'default' | 'granted' | 'denied';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    setSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('[useNotification] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }

    return 'denied';
  }, []);

  // Show notification
  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported || permission !== 'granted') {
        console.warn('[useNotification] Cannot show notification:', { supported, permission });
        return null;
      }

      // Create notification
      const notification = new Notification(title, {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    },
    [supported, permission]
  );

  // Show timer completion notification
  const showTimerCompleteNotification = useCallback(
    (cardTitle: string, duration: number) => {
      const minutes = Math.floor(duration / 60);
      const message = minutes > 0
        ? `Anda telah fokus selama ${minutes} menit.`
        : 'Sesi fokus selesai.';

      return showNotification('Sesi Fokus Selesai', {
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
