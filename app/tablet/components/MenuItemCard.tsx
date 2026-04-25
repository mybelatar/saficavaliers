import Image from 'next/image';
import { BilingualMenuName } from '../../components/BilingualMenuName';

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

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem, variant?: MenuItemVariant) => void;
}

export function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  const hasVariants = item.variants.length > 0;
  const minVariantPrice = hasVariants
    ? Math.min(...item.variants.map((variant) => variant.price))
    : item.price;

  return (
    <div className="theme-card group overflow-hidden rounded-[2rem] p-4">
      {item.imageUrl && (
        <div className="relative mb-4 h-52 w-full overflow-hidden rounded-[1.5rem]">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,15,11,0.78)] via-transparent to-transparent" />
        </div>
      )}
      <div className="space-y-2">
        <BilingualMenuName
          name={item.name}
          containerClassName="text-lg font-semibold text-white"
          frenchClassName="font-display text-2xl text-white"
          arabicClassName="text-lg font-semibold text-amber-100"
        />
        {item.description && <p className="text-sm leading-6 text-[var(--sand-400)]">{item.description}</p>}
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-[rgba(215,175,105,0.16)] bg-[rgba(111,67,48,0.18)] px-3 py-1 text-sm font-semibold text-[var(--sand-50)]">
            {hasVariants ? `A partir de ${minVariantPrice.toFixed(2)} MAD` : `${item.price.toFixed(2)} MAD`}
          </span>
        </div>
        {hasVariants ? (
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            {item.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onAddToOrder(item, variant)}
                disabled={!item.available || !variant.available}
                className="rounded-xl border border-[rgba(215,175,105,0.12)] bg-[rgba(111,67,48,0.18)] px-3 py-2 text-left transition-colors hover:bg-[rgba(171,97,54,0.28)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <p className="text-sm font-semibold leading-tight text-[var(--sand-50)]">{variant.name}</p>
                <p className="text-xs text-[var(--sand-400)]">{variant.price.toFixed(2)} MAD</p>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => onAddToOrder(item)}
            disabled={!item.available}
            className="theme-action w-full rounded-xl px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}
