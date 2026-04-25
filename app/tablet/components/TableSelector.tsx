interface Table {
  id: string;
  number: number;
  seats: number;
}

interface TableSelectorProps {
  tables: Table[];
  selectedTableId?: string;
  onSelectTable: (tableId: string) => void;
}

export function TableSelector({ tables, selectedTableId, onSelectTable }: TableSelectorProps) {
  return (
    <div className="theme-card rounded-3xl p-6">
      <div className="mb-4 space-y-2">
        <p className="section-kicker">Salle</p>
        <h2 className="theme-panel-title">Selectionnez une table</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onSelectTable(table.id)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedTableId === table.id
                ? 'border-[rgba(215,175,105,0.42)] bg-[rgba(171,97,54,0.2)] text-[var(--sand-50)]'
                : 'border-[rgba(215,175,105,0.12)] bg-[rgba(111,67,48,0.12)] text-[var(--sand-200)] hover:border-[rgba(215,175,105,0.26)]'
            }`}
          >
            <div className="text-center">
              <div className="font-display text-2xl">Table {table.number}</div>
              <div className="text-sm opacity-75">{table.seats} places</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
