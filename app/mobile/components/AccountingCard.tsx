interface AccountingCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function AccountingCard({ title, amount, subtitle, trend }: AccountingCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(value);
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'theme-text-success';
      case 'down':
        return 'theme-text-danger';
      default:
        return 'theme-card-soft-text';
    }
  };

  const getTrendArrow = () => {
    switch (trend) {
      case 'up':
        return 'UP';
      case 'down':
        return 'DOWN';
      default:
        return 'FLAT';
    }
  };

  return (
    <div className="theme-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="theme-panel-title">{title}</h3>
        {trend && <div className={`text-xs font-semibold ${getTrendColor()}`}>{getTrendArrow()}</div>}
      </div>
      <div className="theme-card-strong font-display mb-1 text-3xl">{formatCurrency(amount)}</div>
      {subtitle && <div className="theme-card-soft-text text-sm">{subtitle}</div>}
    </div>
  );
}
