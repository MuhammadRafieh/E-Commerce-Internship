export function formatCurrency(amount) {
  const num = Number(amount)
  if (isNaN(num) || num < 0) return 'Rs 0.00'
  return 'Rs ' + num.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
