import Image from 'next/image';
import { BilingualMenuName } from '../../components/BilingualMenuName';

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

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
}

export function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500';
      case 'READY':
        return 'bg-emerald-500';
      case 'COMPLETED':
        return 'bg-gray-500';
      case 'CANCELED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'IN_PROGRESS':
        return 'En preparation';
      case 'READY':
        return 'Pret';
      case 'COMPLETED':
        return 'Termine';
      case 'CANCELED':
        return 'Annule';
      default:
        return status;
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'PENDING':
        return 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'READY';
      case 'READY':
        return 'COMPLETED';
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="theme-card rounded-3xl p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-3xl text-white">Table {order.tableNumber}</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
          <span className="text-sm text-[var(--sand-400)]">{getStatusText(order.status)}</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {order.items.map((item) => (
          <div key={item.id} className="theme-card-soft rounded-xl p-4">
            <div className="flex items-start gap-3">
              {item.imageUrl && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[rgba(215,175,105,0.14)] bg-[rgba(17,13,11,0.5)]">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <BilingualMenuName
                  name={item.name}
                  frenchClassName="font-medium text-white"
                  arabicClassName="font-medium text-amber-100"
                />
                {item.variantName && <p className="text-xs text-emerald-200">{item.variantName}</p>}
                <p className="text-sm text-[var(--sand-400)]">Quantite: {item.quantity}</p>
                {item.note && <p className="text-yellow-400 text-sm mt-1 italic">Note: {item.note}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(order.id, nextStatus)}
            className="theme-action flex-1 rounded-xl py-3 font-semibold text-white"
          >
            {nextStatus === 'IN_PROGRESS' && 'Commencer'}
            {nextStatus === 'READY' && 'Marquer pret'}
            {nextStatus === 'COMPLETED' && 'Terminer'}
          </button>
        )}

        {order.status !== 'CANCELED' && order.status !== 'COMPLETED' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'CANCELED')}
            className="theme-action-danger rounded-xl px-4 py-3 font-semibold"
          >
            Annuler
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-[var(--sand-400)]">
        Commandee a {new Date(order.placedAt).toLocaleTimeString('fr-MA')}
      </div>
    </div>
  );
}
