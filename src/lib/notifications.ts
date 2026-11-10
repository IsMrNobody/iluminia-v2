/**
 * Ilumina - Web Push Notifications & Permission Manager
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Este navegador no soporta notificaciones push.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export async function showLocalNotification(title: string, options?: NotificationOptions) {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration && registration.showNotification) {
      registration.showNotification(title, {
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        ...options
      });
      return;
    }
  }

  new Notification(title, {
    icon: "/icons/icon-192.png",
    ...options
  });
}
