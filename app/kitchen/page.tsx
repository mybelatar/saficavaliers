'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BrandSignature } from '../components/BrandSignature';
import { OrderCard } from './components/OrderCard';
import { ROLE_STORAGE_KEY } from '../../lib/roles';
import { playNotificationSound, primeNotificationAudio } from '../../lib/notification-sound';

interface OrderItem {
  id: string;
  name: string;
  imageUrl?: string;
  variantName?: string;
  quantity: number;
  note?: string;
}

interface Order {
  id: string;
  tableNumber: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELED';
  items: OrderItem[];
  placedAt: string;
}

interface NotificationMessage {
  id: string;
  type: 'NEW_ORDER' | 'ORDER_STATUS';
  message: string;
  createdAt: string;
  status?: string;
}

type KitchenFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'READY';

const FILTER_OPTIONS: Array<{ key: KitchenFilter; label: string }> = [
  { key: 'ALL', label: 'Toutes les commandes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'IN_PROGRESS', label: 'En preparation' },
  { key: 'READY', label: 'Pretes' }
];

export default function KitchenPage() {
  const soundPreferenceKey = 'restaurant_notification_sound_kitchen';
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<KitchenFilter>('ALL');
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasKitchenProfile, setHasKitchenProfile] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = (await response.json()) as Order[];
      setOrders(data);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Impossible de charger les commandes en direct.');
    } finally {
      setLoading(false);
    }
  }, []);

  const playSoundForNotification = useCallback(
    (notification: NotificationMessage) => {
      if (!soundEnabled) {
        return;
      }

      if (notification.type === 'NEW_ORDER') {
        void playNotificationSound('NEW_ORDER');
        return;
      }

      if (notification.status === 'READY') {
        void playNotificationSound('ORDER_READY');
        return;
      }

      void playNotificationSound('STATUS_CHANGED');
    },
    [soundEnabled]
  );

  const toggleSound = () => {
    setSoundEnabled((previous) => {
      const nextValue = !previous;
      localStorage.setItem(soundPreferenceKey, String(nextValue));

      if (nextValue) {
        void primeNotificationAudio();
      }

      return nextValue;
    });
  };

  useEffect(() => {
    const role = localStorage.getItem(ROLE_STORAGE_KEY);
    setHasKitchenProfile(role === 'KITCHEN');
    const savedSound = localStorage.getItem(soundPreferenceKey);
    if (savedSound === 'false') {
      setSoundEnabled(false);
    }
    setProfileChecked(true);
  }, [soundPreferenceKey]);

  useEffect(() => {
    if (!hasKitchenProfile) {
      return;
    }

    void fetchOrders();
    const polling = setInterval(() => {
      void fetchOrders();
    }, 10000);

    return () => {
      clearInterval(polling);
    };
  }, [fetchOrders, hasKitchenProfile]);

  useEffect(() => {
    if (!hasKitchenProfile || !soundEnabled) {
      return;
    }

    void primeNotificationAudio();

    const unlockAudio = () => {
      void primeNotificationAudio();
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [hasKitchenProfile, soundEnabled]);

  useEffect(() => {
    if (!hasKitchenProfile) {
      return;
    }

    const eventSource = new EventSource('/api/notifications/stream?role=KITCHEN');
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificationMessage;
        setNotifications((prev) => [payload, ...prev].slice(0, 4));
        playSoundForNotification(payload);
        void fetchOrders();
      } catch (parseError) {
        console.error('Invalid notification payload:', parseError);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [fetchOrders, hasKitchenProfile, playSoundForNotification]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      await fetchOrders();
    } catch (updateError) {
      console.error(updateError);
      alert('Echec de mise a jour statut commande.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'ALL') {
      return order.status !== 'COMPLETED' && order.status !== 'CANCELED';
    }

    return order.status === filter;
  });

  const getOrderCount = (status: Order['status']) => {
    return orders.filter((order) => order.status === status).length;
  };

  if (!profileChecked) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8 text-[var(--ink-950)] sm:px-6 sm:py-12">
        <p>Chargement du profil...</p>
      </main>
    );
  }

  if (!hasKitchenProfile) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8 text-[var(--ink-950)] sm:px-6 sm:py-12">
        <div className="theme-card max-w-md rounded-3xl p-8 text-center">
          <h1 className="font-display mb-3 text-4xl text-white">Profil cuisine requis</h1>
          <p className="mb-6 text-[var(--sand-400)]">
            Cette tablette doit etre configuree en profil Cuisinier pour traiter les commandes.
          </p>
          <Link href="/" className="theme-action inline-flex rounded-xl px-4 py-2 text-white">
            Choisir un profil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell px-4 py-4 text-[var(--ink-950)] sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <section className="page-hero mb-5 rounded-[1.6rem] p-4 sm:p-5">
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <BrandSignature compact />
              <span className="section-kicker">Cuisine - Commandes</span>
              <div className="space-y-2">
                <h1 className="font-display text-3xl leading-tight text-[var(--ink-950)] sm:text-4xl">Ecran cuisine</h1>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-700)]">Flux en direct</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="theme-chip">Production</span>
              <button
                onClick={toggleSound}
                className={`rounded-full px-4 py-2 text-xs font-medium ${
                  soundEnabled ? 'theme-action' : 'theme-action-secondary'
                }`}
              >
                Son {soundEnabled ? 'ON' : 'OFF'}
              </button>
              <Link href="/" className="theme-action-secondary rounded-full px-4 py-2 text-sm">
                Changer profil
              </Link>
            </div>
          </div>
        </section>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-700)]">Operations</p>
            <h2 className="font-display text-2xl text-[var(--ink-950)]">File des commandes</h2>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="space-y-2 mb-6">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3">
                <p className="text-sm text-sky-200">{notification.message}</p>
                <p className="text-xs text-slate-400">
                  {new Date(notification.createdAt).toLocaleTimeString('fr-MA')}
                </p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 mb-6">
            <p className="text-red-300">{error}</p>
            <button onClick={() => void fetchOrders()} className="mt-2 text-sm text-red-200 underline">
              Reessayer
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="theme-card-soft flex flex-wrap items-center gap-4 rounded-3xl p-4 text-sm text-[var(--sand-50)]">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>En attente: {getOrderCount('PENDING')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>En cours: {getOrderCount('IN_PROGRESS')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Pret: {getOrderCount('READY')}</span>
            </div>
          </div>
        </div>

        <div className="theme-tabbar mb-8 rounded-3xl p-6">
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filter === key ? 'theme-tab-active' : 'theme-tab theme-action-secondary'
                }`}
              >
                {label} ({key === 'ALL' ? filteredOrders.length : getOrderCount(key)})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Chargement des commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-slate-400 mb-2">Aucune commande</h2>
            <p className="text-slate-500">Les nouvelles commandes apparaitront ici automatiquement.</p>
          </div>
        ) : (
          <div className={updating ? 'pointer-events-none opacity-70' : ''}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
