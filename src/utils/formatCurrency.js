export function formatCurrency(value = 0) {
  const number = Number(value) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number)
}

export function parseCurrencyInput(value = '') {
  return Number(String(value).replace(/[^0-9]/g, '')) || 0
}
