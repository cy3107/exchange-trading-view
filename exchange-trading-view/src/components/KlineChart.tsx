import { useEffect, useRef } from 'react'
import { init, dispose } from 'klinecharts'
import type { KLineData } from 'klinecharts'
import { useAtomValue } from 'jotai'
import { connectionAtom, tickAtom } from '../state/marketAtoms'

interface Props {
  mode: 'spot' | 'perpetual'
}

export default function KlineChart({ mode }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<ReturnType<typeof init> | null>(null)
  const candlesRef = useRef<KLineData[]>([])
  const lastCandleAtRef = useRef(0)
  const tick = useAtomValue(tickAtom)
  const connection = useAtomValue(connectionAtom)

  // Different cadence for spot vs perpetual demo.
  const interval = mode === 'spot' ? 1000 : 2000

  // Seed a baseline candle series.
  const seedCandles = (count: number) => {
    const data: KLineData[] = []
    let timestamp = Date.now() - count * interval
    let price = tick.price || 60000
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 80
      price += change
      const open = price
      const close = price + (Math.random() - 0.5) * 40
      const high = Math.max(open, close) + Math.random() * 30
      const low = Math.min(open, close) - Math.random() * 30
      timestamp += interval
      data.push({
        open,
        close,
        high,
        low,
        volume: Math.random() * 2000,
        timestamp
      })
    }
    return data
  }

  useEffect(() => {
    if (!chartRef.current) return
    const chart = init(chartRef.current, { styles: 'dark' })
    if (!chart) return
    chartInstanceRef.current = chart
    const initial = seedCandles(mode === 'spot' ? 120 : 200)
    candlesRef.current = initial
    lastCandleAtRef.current = initial[initial.length - 1]?.timestamp ?? 0
    chart.applyNewData(initial)

    return () => {
      dispose(chart)
    }
  }, [mode, interval])

  useEffect(() => {
    const chart = chartInstanceRef.current
    if (!chart || !tick.timestamp) return

    // Align tick to current candle slot.
    const candleStart = Math.floor(tick.timestamp / interval) * interval
    let last = candlesRef.current[candlesRef.current.length - 1]

    // Fill any gaps with flat candles.
    const fillMissingCandles = (from: number, to: number, price: number) => {
      for (let ts = from + interval; ts < to; ts += interval) {
        const filler: KLineData = {
          open: price,
          close: price,
          high: price,
          low: price,
          volume: 0,
          timestamp: ts
        }
        candlesRef.current.push(filler)
        chart.updateData(filler)
      }
    }

    if (!last || last.timestamp < candleStart) {
      if (last) {
        fillMissingCandles(last.timestamp, candleStart, last.close)
      }
      // Start a new candle when a new interval begins.
      const candle: KLineData = {
        open: tick.price,
        close: tick.price,
        high: tick.price,
        low: tick.price,
        volume: Math.random() * 1200,
        timestamp: candleStart
      }
      candlesRef.current.push(candle)
      chart.updateData(candle)
      lastCandleAtRef.current = candleStart
      return
    }

    // Update current candle with latest tick.
    last = {
      ...last,
      close: tick.price,
      high: Math.max(last.high, tick.price),
      low: Math.min(last.low, tick.price),
      volume: last.volume + Math.random() * 120
    }
    candlesRef.current[candlesRef.current.length - 1] = last
    chart.updateData(last)
  }, [tick, interval])

  useEffect(() => {
    if (connection.status !== 'connected') return
    if (!connection.lastDisconnectAt || !lastCandleAtRef.current) return
    const now = Date.now()
    if (now - lastCandleAtRef.current <= interval) return

    const chart = chartInstanceRef.current
    if (!chart) return

    // Backfill candles after reconnect.
    for (
      let ts = lastCandleAtRef.current + interval;
      ts < now;
      ts += interval
    ) {
      const lastPrice =
        candlesRef.current[candlesRef.current.length - 1]?.close ?? tick.price
      const filler: KLineData = {
        open: lastPrice,
        close: lastPrice,
        high: lastPrice,
        low: lastPrice,
        volume: 0,
        timestamp: ts
      }
      candlesRef.current.push(filler)
      chart.updateData(filler)
      lastCandleAtRef.current = ts
    }
  }, [connection.status, connection.lastDisconnectAt, interval, tick.price])

  return <div ref={chartRef} style={{ height: '500px', width: '100%' }} />
}
