'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { MenuItemCard } from './components/MenuItemCard';
import { OrderSummary } from './components/OrderSummary';
import { TableSelector } from './components/TableSelector';
import { ROLE_STORAGE_KEY } from '../../lib/roles';
import { playNotificationSound, primeNotificationAudio } from '../../lib/notification-sound';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  categoryId: string;
  variants: MenuItemVariant[];
}

interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
  available: boolean;
  sortOrder: number;
}

interface MenuCategory {
  id: string;
  name: string;
}

interface Table {
  id: string;
  number: number;
  seats: number;
}

interface OrderItem {
  id: string;
  menuItemId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  note?: string;
}

interface NotificationMessage {
  id: string;
  type: 'NEW_ORDER' | 'ORDER_STATUS';
  message: string;
  createdAt: string;
  status?: string;
}

interface TabletDataResponse {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  tables: Table[];
}

export default function TabletPage() {
  const soundPreferenceKey = 'restaurant_notification_sound_server';
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasServerProfile, setHasServerProfile] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const loadTabletData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tablet-data', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch tablet data');
      }

      const data = (await response.json()) as TabletDataResponse;
      setCategories(data.categories);
      setMenuItems(data.menuItems);
      setTables(data.tables);
      setSelectedCategory((prev) => {
        if (prev && data.categories.some((category) => category.id === prev)) {
          return prev;
        }
        return data.categories[0]?.id ?? '';
      });
    } catch (loadError) {
      console.error(loadError);
      setError('Impossible de charger les donnees. Verifiez la base de donnees.');
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
    setHasServerProfile(role === 'SERVER');
    const savedSound = localStorage.getItem(soundPreferenceKey);
    if (savedSound === 'false') {
      setSoundEnabled(false);
    }
    setProfileChecked(true);
  }, [soundPreferenceKey]);

  useEffect(() => {
    if (!hasServerProfile) {
      return;
    }

    void loadTabletData();
  }, [hasServerProfile, loadTabletData]);

  useEffect(() => {
    if (!hasServerProfile || !soundEnabled) {
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
  }, [hasServerProfile, soundEnabled]);

  useEffect(() => {
    if (!hasServerProfile) {
      return;
    }

    const eventSource = new EventSource('/api/notifications/stream?role=SERVER');
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificationMessage;
        setNotifications((prev) => [payload, ...prev].slice(0, 4));
        playSoundForNotification(payload);
      } catch (parseError) {
        console.error('Invalid notification payload:', parseError);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [hasServerProfile, playSoundForNotification]);

  const filteredItems = menuItems.filter((item) => item.categoryId === selectedCategory);

  const buildOrderLineId = (menuItemId: string, variantId?: string) => `${menuItemId}::${variantId ?? 'base'}`;

  const addToOrder = (item: MenuItem, variant?: MenuItemVariant) => {
    const lineId = buildOrderLineId(item.id, variant?.id);
    const existingItem = orderItems.find((orderItem) => orderItem.id === lineId);
    if (existingItem) {
      setOrderItems((prev) =>
        prev.map((orderItem) =>
          orderItem.id === lineId ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          id: lineId,
          menuItemId: item.id,
          variantId: variant?.id,
          name: item.name,
          variantName: variant?.name,
          price: variant?.price ?? item.price,
          quantity: 1
        }
      ]);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromOrder(itemId);
    } else {
      setOrderItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
    }
  };

  const updateNote = (itemId: string, note: string) => {
    setOrderItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, note } : item)));
  };

  const removeFromOrder = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const submitOrder = async () => {
    if (!selectedTableId) {
      alert('Veuillez selectionner une table');
      return;
    }

    if (orderItems.length === 0) {
      alert('Votre commande est vide');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableId: selectedTableId,
          items: orderItems.map((item) => ({
            menuItemId: item.menuItemId,
            variantId: item.variantId,
            quantity: item.quantity,
            note: item.note
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit order');
      }

      const selectedTable = tables.find((table) => table.id === selectedTableId);
      alert(`Commande envoyee pour la table ${selectedTable?.number ?? ''}`);
      setOrderItems([]);
      setSelectedTableId('');
    } catch (submitError) {
      console.error(submitError);
      alert('Echec envoi commande. Verifiez la connexion serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!profileChecked) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8 text-[var(--ink-950)] sm:px-6 sm:py-12">
        <p>Chargement du profil...</p>
      </main>
    );
  }

  if (!hasServerProfile) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8 text-[var(--ink-950)] sm:px-6 sm:py-12">
        <div className="theme-card max-w-md rounded-3xl p-8 text-center">
          <h1 className="font-display mb-3 text-4xl text-white">Profil serveur requis</h1>
          <p className="mb-6 text-[var(--sand-400)]">
            Cette tablette doit etre configuree en profil Serveur pour prendre les commandes.
          </p>
          <Link href="/" className="theme-action inline-flex rounded-xl px-4 py-2 text-white">
            Choisir un profil
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-8 text-[var(--ink-950)] sm:px-6 sm:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p>Chargement du menu...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell h-[100dvh] overflow-hidden px-3 py-3 text-[var(--ink-950)] sm:px-4 sm:py-4">
      <div className="mx-auto flex h-full max-w-[1800px] flex-col gap-3">
        <section className="theme-card-soft shrink-0 rounded-xl px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-700)]">Serveur</span>
              <h1 className="font-display text-xl text-[var(--ink-950)] sm:text-2xl">Prise de commande</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle inline showLabel={false} />
              <button
                onClick={toggleSound}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  soundEnabled ? 'theme-action' : 'theme-action-secondary'
                }`}
              >
                Son {soundEnabled ? 'ON' : 'OFF'}
              </button>
              <Link href="/" className="theme-action-secondary rounded-full px-3 py-1.5 text-xs">
                Changer profil
              </Link>
            </div>
          </div>
        </section>

        {notifications.length > 0 && (
          <div className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
            <p className="truncate text-xs text-emerald-200">{notifications[0]?.message}</p>
          </div>
        )}

        {error && (
          <div className="shrink-0 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-red-300">{error}</p>
              <button onClick={() => void loadTabletData()} className="text-xs text-red-200 underline">
                Reessayer
              </button>
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="theme-panel-surface flex min-h-0 flex-col rounded-[1.3rem] p-3">
            <div className="shrink-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-700)]">Menu</p>
                <p className="text-xs text-[var(--ink-700)]">{filteredItems.length} article(s)</p>
              </div>

              <div className="theme-tabbar rounded-xl p-2">
                <div className="flex gap-2 overflow-x-auto pb-1 whitespace-nowrap">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedCategory === category.id ? 'theme-tab-active' : 'theme-tab theme-action-secondary'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              {filteredItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line-soft)] px-4 py-10 text-center text-sm text-[var(--ink-700)]">
                  Aucun article dans cette categorie.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
                  {filteredItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAddToOrder={addToOrder} />
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-3">
            <TableSelector
              tables={tables}
              selectedTableId={selectedTableId}
              onSelectTable={setSelectedTableId}
              compact
            />

            <div className={`min-h-0 flex-1 ${submitting ? 'pointer-events-none opacity-70' : ''}`}>
              <OrderSummary
                items={orderItems}
                onUpdateQuantity={updateQuantity}
                onUpdateNote={updateNote}
                onRemoveItem={removeFromOrder}
                onSubmitOrder={submitOrder}
                total={total}
                compact
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
