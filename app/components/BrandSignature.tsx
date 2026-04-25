import Image from 'next/image';

interface BrandSignatureProps {
  subtitle?: string;
  compact?: boolean;
  center?: boolean;
}

export function BrandSignature({
  subtitle = 'Plateforme de gestion du restaurant',
  compact = false,
  center = false
}: BrandSignatureProps) {
  return (
    <div
      className={`brand-signature ${center ? 'items-center text-center' : 'items-start text-left'} ${
        compact ? 'gap-3' : 'gap-4'
      }`}
    >
      <div className="relative shrink-0">
        <Image
          src="/brand/safi-cavaliers-logo-blason.svg"
          alt="Safi Cavaliers"
          width={compact ? 250 : 320}
          height={compact ? 76 : 98}
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
      </div>
      {!compact && <p className="brand-signature-copy">{subtitle}</p>}
    </div>
  );
}
