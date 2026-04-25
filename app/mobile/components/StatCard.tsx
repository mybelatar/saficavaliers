interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

export function StatCard({ title, value, change, icon, color }: StatCardProps) {
  return (
    <div className="theme-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        {change !== undefined && (
          <div className={`text-sm font-medium ${change >= 0 ? 'theme-text-success' : 'theme-text-danger'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="theme-card-strong font-display mb-1 text-3xl">{value}</div>
      <div className="theme-card-soft-text text-sm">{title}</div>
    </div>
  );
}
