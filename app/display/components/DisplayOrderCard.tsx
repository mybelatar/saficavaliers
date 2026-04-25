import { BilingualMenuName } from '../../components/BilingualMenuName';

type DisplayOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED';

export interface DisplayOrderSummaryItem {
  id: string;
  name: string;
  quantity: number;
  variantName: string | null;
}

export interface DisplayOrder {
  id: string;
  code: string;
  tableNumber: number;
  status: DisplayOrderStatus;
  placedAt: string;
  updatedAt: string;
  total: number;
  itemCount: number;
  summaryItems: DisplayOrderSummaryItem[];
}

const PROGRESS_STEPS: Array<{ status: DisplayOrderStatus; label: string; shortLabel: string }> = [
  { status: 'PENDING', label: 'Commande recue', shortLabel: 'Recue' },
  { status: 'IN_PROGRESS', label: 'En preparation', shortLabel: 'Cuisine' },
  { status: 'READY', label: 'Prete a servir', shortLabel: 'Prete' },
  { status: 'COMPLETED', label: 'Servie', shortLabel: 'Servie' }
];

function getStatusIndex(status: DisplayOrderStatus) {
  return PROGRESS_STEPS.findIndex((step) => step.status === status);
}

function getAccentClasses(status: DisplayOrderStatus) {
  switch (status) {
    case 'PENDING':
      return {
        border: 'border-amber-400/45',
        glow: 'from-amber-500/22 via-amber-400/8 to-transparent',
        badge: 'bg-amber-500/18 text-amber-100 border-amber-300/35'
      };
    case 'IN_PROGRESS':
      return {
        border: 'border-sky-400/45',
        glow: 'from-sky-500/18 via-sky-400/8 to-transparent',
        badge: 'bg-sky-500/18 text-sky-100 border-sky-300/35'
      };
    case 'READY':
      return {
        border: 'border-emerald-400/45',
        glow: 'from-emerald-500/22 via-emerald-400/10 to-transparent',
        badge: 'bg-emerald-500/18 text-emerald-100 border-emerald-300/35'
      };
    case 'COMPLETED':
    default:
      return {
        border: 'border-[var(--line-strong)]',
        glow: 'from-[rgba(212,138,83,0.16)] via-[rgba(133,152,106,0.08)] to-transparent',
        badge: 'bg-[rgba(133,152,106,0.18)] text-[var(--sand-50)] border-[var(--line-soft)]'
      };
  }
}

function getStatusLabel(status: DisplayOrderStatus) {
  switch (status) {
    case 'PENDING':
      return 'Recue';
    case 'IN_PROGRESS':
      return 'En cuisine';
    case 'READY':
      return 'Prete';
    case 'COMPLETED':
      return 'Servie';
    default:
      return status;
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-MA', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function DisplayOrderCard({ order }: { order: DisplayOrder }) {
  const statusIndex = getStatusIndex(order.status);
  const accent = getAccentClasses(order.status);
  const visibleItems = order.summaryItems.slice(0, 3);
  const remainingItems = Math.max(0, order.summaryItems.length - visibleItems.length);

  return (
    <article className={`theme-card relative overflow-hidden rounded-[1.75rem] border ${accent.border} p-5`}>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${accent.glow}`} />

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--sand-400)]">Commande {order.code}</p>
            <h3 className="mt-2 font-display text-3xl text-[var(--sand-50)]">Table {order.tableNumber}</h3>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PROGRESS_STEPS.map((step, index) => {
            const reached = index <= statusIndex;
            const current = index === statusIndex;

            return (
              <div key={step.status} className="space-y-2 text-center">
                <div
                  className={`mx-auto h-3.5 w-3.5 rounded-full border transition-colors ${
                    reached
                      ? 'border-[var(--sand-50)] bg-[var(--clay-400)]'
                      : 'border-[var(--line-soft)] bg-transparent'
                  } ${current ? 'shadow-[0_0_0_6px_rgba(212,138,83,0.14)]' : ''}`}
                />
                <p className={`text-[11px] leading-4 ${reached ? 'text-[var(--sand-50)]' : 'text-[var(--sand-400)]'}`}>
                  {step.shortLabel}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-soft)]/50 p-3">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex min-w-[2.1rem] justify-center rounded-full bg-[rgba(212,138,83,0.16)] px-2 py-1 text-xs font-semibold text-[var(--sand-50)]">
                x{item.quantity}
              </span>
              <div className="min-w-0 flex-1">
                <BilingualMenuName
                  name={item.name}
                  frenchClassName="text-sm font-medium text-[var(--sand-50)]"
                  arabicClassName="text-sm font-medium text-[var(--sand-200)]"
                />
                {item.variantName && <p className="mt-1 text-xs text-[var(--sand-400)]">{item.variantName}</p>}
              </div>
            </div>
          ))}
          {remainingItems > 0 && <p className="text-xs text-[var(--sand-400)]">+ {remainingItems} autres lignes</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-[var(--sand-400)]">{order.itemCount} article(s)</p>
          <div className="flex flex-wrap items-center gap-3 text-[var(--sand-400)]">
            <span>Recue a {formatTime(order.placedAt)}</span>
            {order.status === 'COMPLETED' ? (
              <span>Servie a {formatTime(order.updatedAt)}</span>
            ) : (
              <span>Suivi en direct</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
