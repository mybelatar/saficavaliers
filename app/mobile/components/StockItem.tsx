interface StockItemProps {
  name: string;
  currentStock: number;
  minStock?: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export function StockItem({ name, currentStock, minStock, unit, status }: StockItemProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'theme-text-success';
      case 'warning': return 'theme-text-warning';
      case 'critical': return 'theme-text-danger';
      default: return 'theme-card-soft-text';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'good': return 'theme-badge-success';
      case 'warning': return 'theme-badge-warning';
      case 'critical': return 'theme-badge-danger';
      default: return 'theme-pill';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'good':
        return 'En stock';
      case 'warning':
        return 'Faible';
      case 'critical':
        return 'Critique';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="theme-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="theme-panel-title">{name}</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg()} ${status === 'good' || status === 'warning' || status === 'critical' ? '' : getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="theme-card-soft-text">Stock actuel</span>
          <span className="theme-card-strong font-medium">{currentStock} {unit}</span>
        </div>
        {minStock !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="theme-card-soft-text">Seuil mini</span>
            <span className="theme-card-muted">{minStock} {unit}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="theme-card-soft-text">Statut</span>
          <span className={getStatusColor()}>{getStatusText()}</span>
        </div>
      </div>
    </div>
  );
}
