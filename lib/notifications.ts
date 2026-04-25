import { randomUUID } from 'node:crypto';
import type { UserRole } from './roles';

export type NotificationType = 'NEW_ORDER' | 'ORDER_STATUS' | 'STOCK_ALERT' | 'RESERVATION_UPDATE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  orderId?: string;
  tableNumber?: number;
  status?: string;
  stockItemId?: string;
  stockQuantity?: number;
  minQuantity?: number;
  reservationId?: string;
  reservationStatus?: string;
  createdAt: string;
  targetRoles: UserRole[];
}

type Listener = (notification: AppNotification) => void;

class NotificationHub {
  private listeners: Record<UserRole, Set<Listener>> = {
    SERVER: new Set(),
    KITCHEN: new Set(),
    MANAGER: new Set(),
    DISPLAY: new Set()
  };

  publish(payload: Omit<AppNotification, 'id' | 'createdAt'>) {
    const notification: AppNotification = {
      ...payload,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };

    for (const role of notification.targetRoles) {
      for (const listener of this.listeners[role]) {
        listener(notification);
      }
    }
  }

  subscribe(role: UserRole, listener: Listener) {
    this.listeners[role].add(listener);

    return () => {
      this.listeners[role].delete(listener);
    };
  }
}

const globalForNotifications = globalThis as unknown as {
  notificationHub?: NotificationHub;
};

export const notificationHub = globalForNotifications.notificationHub ?? new NotificationHub();

if (process.env.NODE_ENV !== 'production') {
  globalForNotifications.notificationHub = notificationHub;
}
