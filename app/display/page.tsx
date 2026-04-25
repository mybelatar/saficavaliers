'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DisplayOrderCard, type DisplayOrder } from './components/DisplayOrderCard';

interface OrderBoardResponse {
  generatedAt: string;
  orders: DisplayOrder[];
}

interface DisplayNotification {
  id: string;
  type: 'NEW_ORDER' | 'ORDER_STATUS';
  message: string;
  createdAt: string;
  status?: string;
}

const BOARD_SECTIONS: Array<{
  status: DisplayOrder['status'];
  title: string;
  subtitle: string;
}> = [
  {
    status: 'PENDING',
    title: '1. Recues',
    subtitle: 'Nouvelles commandes'
  },
  {
    status: 'IN_PROGRESS',
    title: '2. En preparation',
    subtitle: 'Cuisine active'
  },
  {
    status: 'READY',
    title: '3. Pretes',
    subtitle: 'A servir'
  },
  {
    status: 'COMPLETED',
    title: '4. Servies',
    subtitle: 'Historique recent'
  }
];

const MAX_VISIBLE_BY_STATUS: Record<DisplayOrder['status'], number> = {
  PENDING: 3,
  IN_PROGRESS: 3,
  READY: 3,
  COMPLETED: 2
};

function formatClock(value: Date) {
  return value.toLocaleTimeString('fr-MA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function DisplayPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<DisplayNotification | null>(null);
  const [clockLabel, setClockLabel] = useState('--:--:--');

  const loadBoard = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch('/api/order-board', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch board data');
      }

      const payload = (await response.json()) as OrderBoardResponse;
      setOrders(payload.orders);
      setGeneratedAt(payload.generatedAt);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Impossible de charger le suivi des commandes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBoard();

    const polling = window.setInterval(() => {
      void loadBoard(true);
    }, 15000);

    return () => {
      window.clearInterval(polling);
    };
  }, [loadBoard]);

  useEffect(() => {
    const updateClock = () => {
      setClockLabel(formatClock(new Date()));
    };

    updateClock();
    const ticker = window.setInterval(updateClock, 1000);

    return () => {
      window.clearInterval(ticker);
    };
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream?role=DISPLAY');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as DisplayNotification;
        setLiveMessage(payload);
        void loadBoard(true);
      } catch (parseError) {
        console.error('Invalid display notification payload:', parseError);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [loadBoard]);

  const groupedOrders = useMemo(
    () =>
      BOARD_SECTIONS.map((section) => {
        const allOrders = orders.filter((order) => order.status === section.status);
        const maxVisible = MAX_VISIBLE_BY_STATUS[section.status];

        return {
          ...section,
          totalOrders: allOrders.length,
          orders: allOrders.slice(0, maxVisible),
          hiddenOrdersCount: Math.max(0, allOrders.length - maxVisible)
        };
      }),
    [orders]
  );

  const activeOrdersCount = useMemo(
    () => orders.filter((order) => order.status !== 'COMPLETED').length,
    [orders]
  );

  return (
    <main className="app-shell h-[100dvh] overflow-hidden px-2 py-2 text-[var(--ink-950)] xl:px-3 xl:py-3">
      <div className="mx-auto flex h-full max-w-[1900px] flex-col gap-2 overflow-hidden">
        <section className="page-hero shrink-0 rounded-[1.2rem] p-3">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="section-kicker">Suivi des commandes</span>
              <h1 className="mt-1 font-display text-2xl text-[var(--ink-950)] xl:text-3xl">Board en direct</h1>
              {liveMessage && (
                <p className="mt-1 truncate text-[11px] text-[var(--ink-700)]">
                  Derniere action: {liveMessage.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="theme-card-soft rounded-xl px-3 py-2 text-[var(--sand-50)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sand-400)]">En direct</p>
                <p className="font-display text-xl leading-none text-[var(--sand-50)]">{clockLabel}</p>
              </div>
              <div className="theme-card-soft rounded-xl px-3 py-2 text-[var(--sand-50)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sand-400)]">Actives</p>
                <p className="text-xl font-semibold leading-none text-[var(--sand-50)]">{activeOrdersCount}</p>
              </div>
              <div className="theme-card-soft rounded-xl px-3 py-2 text-[var(--sand-50)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sand-400)]">Synchro</p>
                <p className="text-sm font-semibold leading-none text-[var(--sand-50)]">
                  {generatedAt ? formatClock(new Date(generatedAt)) : '--:--:--'}
                </p>
              </div>
              <Link href="/" className="theme-action-secondary rounded-full px-3 py-2 text-[11px]">
                Accueil
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div className="shrink-0 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-red-200">{error}</p>
              <button onClick={() => void loadBoard()} className="text-xs text-red-100 underline">
                Recharger
              </button>
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-4">
          {groupedOrders.map((section) => (
            <section key={section.status} className="theme-tabbar flex min-h-0 flex-col rounded-[1.1rem] p-2.5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg text-[var(--ink-950)] xl:text-xl">{section.title}</h2>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-700)]">{section.subtitle}</p>
                </div>
                <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ink-950)]">
                  {section.totalOrders}
                </span>
              </div>

              {loading ? (
                <div className="rounded-xl border border-dashed border-[var(--line-soft)] px-3 py-6 text-center text-xs text-[var(--ink-700)]">
                  Chargement...
                </div>
              ) : section.totalOrders === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line-soft)] px-3 py-6 text-center text-xs text-[var(--ink-700)]">
                  Aucune commande
                </div>
              ) : (
                <div className="min-h-0 space-y-2 overflow-hidden">
                  {section.orders.map((order) => (
                    <DisplayOrderCard key={order.id} order={order} />
                  ))}
                  {section.hiddenOrdersCount > 0 && (
                    <p className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-light)] px-2 py-1 text-center text-[11px] text-[var(--ink-700)]">
                      +{section.hiddenOrdersCount} autres
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="shrink-0 flex items-center justify-between rounded-xl border border-[var(--line-soft)] bg-[var(--surface-soft)]/70 px-3 py-1.5 text-[11px] text-[var(--ink-700)]">
          <p>Auto-refresh: 15s</p>
          <p>{refreshing ? 'Synchronisation...' : 'Flux stable'}</p>
        </div>
      </div>
    </main>
  );
}
