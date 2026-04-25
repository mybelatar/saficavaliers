interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface SimpleChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'line';
}

export function SimpleChart({ title, data, type }: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const barHeightClass = type === 'line' ? 'h-1.5' : 'h-2';

  return (
    <div className="theme-card rounded-3xl p-6">
      <h3 className="theme-panel-title mb-6">{title}</h3>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="theme-card-muted text-sm">{item.label}</span>
                <span className="theme-card-strong font-medium">{item.value}</span>
              </div>
              <div className={`theme-chart-track w-full rounded-full ${barHeightClass}`}>
                <div
                  className={`${barHeightClass} rounded-full transition-all duration-500 ${item.color}`}
                  style={{
                    width: `${(item.value / maxValue) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
