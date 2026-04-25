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
  const accent = getAccentClasses(order.status);
  const visibleItems = order.summaryItems.slice(0, 1);
  const remainingItems = Math.max(0, order.summaryItems.length - visibleItems.length);

  return (
    <article className={`theme-card relative overflow-hidden  border ${accent.border} p-2.5`}>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-br ${accent.glow}`} />

      <div className="relative z-10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--sand-400)]">Commande {order.code}</p>
            <h3 className="mt-0.5 font-display text-xl leading-none text-[var(--sand-50)]">Table {order.tableNumber}</h3>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${accent.badge}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="space-y-1 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)]/50 p-2">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex min-w-[1.8rem] justify-center rounded-full bg-[rgba(212,138,83,0.16)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--sand-50)]">
                x{item.quantity}
              </span>
              <div className="min-w-0 flex-1">
                <BilingualMenuName
                  name={item.name}
                  frenchClassName="line-clamp-1 text-[12px] font-medium text-[var(--sand-50)]"
                  arabicClassName="line-clamp-1 text-[12px] font-medium text-[var(--sand-200)]"
                />
                {item.variantName && <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--sand-400)]">{item.variantName}</p>}
              </div>
            </div>
          ))}
          {remainingItems > 0 && <p className="text-[10px] text-[var(--sand-400)]">+ {remainingItems} autres lignes</p>}
        </div>

        <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--sand-400)]">
          <p>{order.itemCount} article(s)</p>
          <p>{formatTime(order.status === 'COMPLETED' ? order.updatedAt : order.placedAt)}</p>
        </div>
      </div>
    </article>
  );
}
