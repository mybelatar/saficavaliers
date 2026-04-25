'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrandSignature } from '../components/BrandSignature';
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
    title: '1. Commandes recues',
    subtitle: 'Le client vient de valider. La commande entre dans la file.'
  },
  {
    status: 'IN_PROGRESS',
    title: '2. En preparation',
    subtitle: 'La cuisine travaille deja sur la commande.'
  },
  {
    status: 'READY',
    title: '3. Pretes a servir',
    subtitle: 'Les plats sont prets. Le service peut les apporter.'
  },
  {
    status: 'COMPLETED',
    title: '4. Servies recemment',
    subtitle: 'Historique recent pour rassurer les clients avant disparition de l ecran.'
  }
];

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
  const [clock, setClock] = useState(() => new Date());

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
    const ticker = window.setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => {
      window.clearInterval(ticker);
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
      BOARD_SECTIONS.map((section) => ({
        ...section,
        orders: orders.filter((order) => order.status === section.status)
      })),
    [orders]
  );

  const activeOrdersCount = useMemo(
    () => orders.filter((order) => order.status !== 'COMPLETED').length,
    [orders]
  );

  return (
    <main className="app-shell px-6 py-8 text-[var(--ink-950)] xl:px-10 xl:py-10">
      <div className="mx-auto max-w-[1800px] space-y-8">
        <section className="page-hero rounded-[2.25rem] p-6 xl:p-8">
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-5">
              <BrandSignature subtitle="Ecran client - Suivi visible des commandes en salle" />
              <span className="section-kicker">Salle - Grand ecran - Suivi des commandes</span>
              <div className="space-y-3">
                <h1 className="section-title hero-title-light">Chaque client voit l avancement de sa commande, de la reception jusqu au service.</h1>
                <p className="section-subtitle hero-copy-light max-w-4xl text-sm xl:text-base">
                  L ecran affiche plusieurs commandes en meme temps, les trie par etape et se met a jour
                  automatiquement quand la cuisine ou le service change un statut.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="theme-chip">Grand ecran salle</span>
                <span className="theme-chip">Mise a jour en direct</span>
                <span className="theme-chip">Plusieurs commandes simultanees</span>
              </div>
            </div>

            <div className="theme-card-soft rounded-[1.75rem] p-5 text-[var(--sand-50)] xl:min-w-[340px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[var(--sand-400)]">En direct</p>
                  <p className="mt-2 font-display text-4xl text-[var(--sand-50)]">{formatClock(clock)}</p>
                </div>
                <Link href="/" className="theme-action-secondary rounded-full px-4 py-2 text-sm">
                  Retour accueil
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-soft)]/55 p-3">
                  <p className="text-[var(--sand-400)]">Commandes actives</p>
                  <p className="mt-1 text-3xl font-semibold text-[var(--sand-50)]">{activeOrdersCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-soft)]/55 p-3">
                  <p className="text-[var(--sand-400)]">Derniere synchro</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--sand-50)]">
                    {generatedAt ? formatClock(new Date(generatedAt)) : '--:--:--'}
                  </p>
                </div>
              </div>
              {liveMessage && (
                <div className="mt-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-soft)]/55 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--sand-400)]">Derniere action</p>
                  <p className="mt-2 text-sm text-[var(--sand-50)]">{liveMessage.message}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-4">
            <p className="text-red-200">{error}</p>
            <button onClick={() => void loadBoard()} className="mt-2 text-sm text-red-100 underline">
              Recharger l ecran
            </button>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-4">
          {groupedOrders.map((section) => (
            <section key={section.status} className="theme-tabbar rounded-[2rem] p-4 xl:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-[var(--ink-950)]">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{section.subtitle}</p>
                </div>
                <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-light)] px-3 py-1 text-sm font-semibold text-[var(--ink-950)]">
                  {section.orders.length}
                </span>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-dashed border-[var(--line-soft)] px-4 py-12 text-center text-sm text-[var(--ink-700)]">
                  Chargement...
                </div>
              ) : section.orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line-soft)] px-4 py-12 text-center text-sm text-[var(--ink-700)]">
                  Aucune commande dans cette etape.
                </div>
              ) : (
                <div className="space-y-4">
                  {section.orders.map((order) => (
                    <DisplayOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-soft)]/70 px-4 py-3 text-sm text-[var(--ink-700)]">
          <p>Actualisation automatique toutes les 15 secondes, avec relance immediate sur nouvel evenement.</p>
          <p>{refreshing ? 'Synchronisation...' : 'Flux stable'}</p>
        </div>
      </div>
    </main>
  );
}
