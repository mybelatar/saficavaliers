import { BilingualMenuName } from '../../components/BilingualMenuName';

interface OrderItem {
  id: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  note?: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateNote: (itemId: string, note: string) => void;
  onRemoveItem: (itemId: string) => void;
  onSubmitOrder: () => void;
  total: number;
  compact?: boolean;
}

export function OrderSummary({
  items,
  onUpdateQuantity,
  onUpdateNote,
  onRemoveItem,
  onSubmitOrder,
  total,
  compact = false
}: OrderSummaryProps) {
  if (items.length === 0) {
    return (
      <div className={`${compact ? 'theme-card h-full rounded-2xl p-4' : 'theme-card rounded-3xl p-6'} text-center`}>
        <p className="text-[var(--sand-400)]">Votre commande est vide</p>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'theme-card h-full rounded-2xl p-4' : 'theme-card rounded-3xl p-6'} flex flex-col`}>
      <div className={compact ? 'shrink-0 space-y-1' : 'shrink-0 space-y-2'}>
        <p className="section-kicker">Commande</p>
        <h2 className={compact ? 'font-display text-lg text-white' : 'theme-panel-title'}>Votre commande</h2>
      </div>

      <div className={`${compact ? 'mt-3 space-y-2' : 'mt-4 space-y-3'} min-h-0 flex-1 overflow-y-auto pr-1`}>
        {items.map((item) => (
          <div key={item.id} className={`theme-card-soft ${compact ? 'rounded-lg p-3' : 'rounded-xl p-4'}`}>
            <div className={`${compact ? 'mb-1.5' : 'mb-2'} flex items-start justify-between gap-3`}>
              <div className="min-w-0 flex-1">
                <BilingualMenuName
                  name={item.name}
                  frenchClassName="text-white font-medium"
                  arabicClassName="font-medium text-amber-100"
                />
                {item.variantName && <p className="mt-1 text-xs text-emerald-200">{item.variantName}</p>}
              </div>
              <button onClick={() => onRemoveItem(item.id)} className="text-red-400 hover:text-red-300 text-sm">
                Supprimer
              </button>
            </div>

            <div className={`${compact ? 'mb-1.5 gap-2' : 'mb-2 gap-3'} flex flex-col sm:flex-row sm:items-center sm:justify-between`}>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className={`${compact ? 'h-7 w-7 text-sm' : 'h-8 w-8'} flex items-center justify-center rounded-full border border-[rgba(215,175,105,0.16)] bg-[rgba(111,67,48,0.2)] text-white`}
                >
                  -
                </button>
                <span className="text-white min-w-[2rem] text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className={`${compact ? 'h-7 w-7 text-sm' : 'h-8 w-8'} flex items-center justify-center rounded-full border border-[rgba(215,175,105,0.16)] bg-[rgba(111,67,48,0.2)] text-white`}
                >
                  +
                </button>
              </div>
              <span className="font-semibold text-[var(--sand-50)]">{(item.price * item.quantity).toFixed(2)} MAD</span>
            </div>

            <textarea
              value={item.note || ''}
              onChange={(e) => onUpdateNote(item.id, e.target.value)}
              placeholder="Note speciale..."
              className="w-full rounded-lg border border-[rgba(215,175,105,0.12)] bg-[rgba(17,13,11,0.52)] px-3 py-2 text-sm text-white resize-none"
              rows={compact ? 1 : 2}
            />
          </div>
        ))}
      </div>

      <div className={`${compact ? 'pt-3 mt-3' : 'pt-4 mt-4'} shrink-0 border-t border-[rgba(215,175,105,0.12)]`}>
        <div className={`${compact ? 'mb-3' : 'mb-4'} flex items-center justify-between gap-3`}>
          <span className="text-white font-semibold">Total</span>
          <span className={`${compact ? 'text-xl' : 'text-2xl'} font-display text-[var(--sand-50)]`}>
            {total.toFixed(2)} MAD
          </span>
        </div>

        <button
          onClick={onSubmitOrder}
          className={`${compact ? 'py-2.5 text-sm' : 'py-3'} theme-action w-full rounded-xl font-semibold text-white`}
        >
          Passer la commande
        </button>
      </div>
    </div>
  );
}
