import type { KLineData } from 'klinecharts'

export function generateMockData(count: number): KLineData[] {
  const data: KLineData[] = []
  let timestamp = Date.now() - count * 60 * 1000
  let price = 60000

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 200
    price += change
    const open = price
    const close = price + (Math.random() - 0.5) * 150
    const high = Math.max(open, close) + Math.random() * 100
    const low = Math.min(open, close) - Math.random() * 100

    data.push({
      open,
      close,
      high,
      low,
      volume: Math.random() * 1000000,
      timestamp: timestamp += 60 * 1000
    })
  }
  return data
}
