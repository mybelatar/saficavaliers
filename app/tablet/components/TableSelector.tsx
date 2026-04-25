interface Table {
  id: string;
  number: number;
  seats: number;
}

interface TableSelectorProps {
  tables: Table[];
  selectedTableId?: string;
  onSelectTable: (tableId: string) => void;
  compact?: boolean;
}

export function TableSelector({ tables, selectedTableId, onSelectTable, compact = false }: TableSelectorProps) {
  return (
    <div className={compact ? 'theme-card rounded-2xl p-3' : 'theme-card rounded-3xl p-6'}>
      <div className={compact ? 'mb-3 space-y-1' : 'mb-4 space-y-2'}>
        <p className="section-kicker">Salle</p>
        <h2 className={compact ? 'font-display text-lg text-white' : 'theme-panel-title'}>Selectionnez une table</h2>
      </div>

      <div
        className={
          compact ? 'grid max-h-44 grid-cols-3 gap-2 overflow-y-auto pr-1' : 'grid grid-cols-2 gap-3 sm:grid-cols-3'
        }
      >
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onSelectTable(table.id)}
            title={`Table ${table.number}`}
            className={`${compact ? 'rounded-lg p-2' : 'rounded-xl p-4'} border-2 transition-all ${
              selectedTableId === table.id
                ? 'border-[rgba(215,175,105,0.42)] bg-[rgba(171,97,54,0.2)] text-[var(--sand-50)]'
                : 'border-[rgba(215,175,105,0.12)] bg-[rgba(111,67,48,0.12)] text-[var(--sand-200)] hover:border-[rgba(215,175,105,0.26)]'
            }`}
          >
            <div className="text-center">
              <div className={compact ? 'font-display text-base' : 'font-display text-2xl'}>
                {compact ? `T${table.number}` : `Table ${table.number}`}
              </div>
              <div className={compact ? 'text-[11px] opacity-75' : 'text-sm opacity-75'}>{table.seats} places</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
