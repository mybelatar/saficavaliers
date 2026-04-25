export type StockLevelStatus = 'good' | 'warning' | 'critical';

export function getStockLevelStatus(quantity: number, minQuantity: number): StockLevelStatus {
  const safeQuantity = Math.max(0, Math.round(quantity));
  const safeMinQuantity = Math.max(0, Math.round(minQuantity));

  if (safeQuantity <= 0) {
    return 'critical';
  }

  if (safeMinQuantity <= 0) {
    return 'good';
  }

  if (safeQuantity <= safeMinQuantity) {
    return 'critical';
  }

  if (safeQuantity <= Math.ceil(safeMinQuantity * 1.5)) {
    return 'warning';
  }

  return 'good';
}

export function formatStockAlertMessage(
  itemName: string,
  quantity: number,
  minQuantity: number,
  unit: string
) {
  const status = getStockLevelStatus(quantity, minQuantity);
  const levelText = status === 'critical' ? 'critique' : 'faible';
  return `Stock ${levelText}: ${itemName} (${quantity} ${unit}, min ${minQuantity})`;
}
