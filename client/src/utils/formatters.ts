export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace(/,/g, ' ')
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num).replace(/,/g, ' ')
}

export const formatStatus = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    'bank_transfer': 'Bank Transfer',
    'card': 'Card',
    'cash': 'Cash',
    'online': 'Online'
  }
  return methodMap[method] || formatStatus(method)
}
