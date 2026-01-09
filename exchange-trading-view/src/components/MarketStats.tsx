import { useEffect, useMemo, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { orderBookAtom, tickAtom, tradesAtom } from '../state/marketAtoms'

// Format numbers with fixed precision.
const formatNumber = (value: number, digits = 2) =>
  value.toLocaleString('en-US', { maximumFractionDigits: digits })

// Top bar market summary.
export default function MarketStats() {
  const tick = useAtomValue(tickAtom)
  const orderBook = useAtomValue(orderBookAtom)
  const trades = useAtomValue(tradesAtom)
  const baseRef = useRef<number>(0)

  useEffect(() => {
    // Fix base price on first tick for change calculation.
    if (!baseRef.current && tick.price) {
      baseRef.current = tick.price
    }
  }, [tick.price])

  const change = useMemo(() => {
    // Percent change from base.
    if (!baseRef.current || !tick.price) return 0
    return ((tick.price - baseRef.current) / baseRef.current) * 100
  }, [tick.price])

  const volume = useMemo(() => {
    // Aggregate recent trade size as volume.
    return trades.reduce((sum, trade) => sum + trade.size, 0)
  }, [trades])

  // Approximate 24h high/low using current book.
  const high = Math.max(
    orderBook.asks[orderBook.asks.length - 1]?.price ?? tick.price ?? 0,
    tick.price ?? 0
  )
  const low = Math.min(
    orderBook.bids[orderBook.bids.length - 1]?.price ?? tick.price ?? 0,
    tick.price ?? 0
  )

  return (
    <div className="market-stats">
      <div className="pair">
        <div className="pair-name">BTC-PERP</div>
        <div className={`pair-price ${change >= 0 ? 'up' : 'down'}`}>
          {tick.price ? formatNumber(tick.price, 2) : '--'}
        </div>
      </div>
      <div className="stat">
        <span>涨跌幅</span>
        <strong className={change >= 0 ? 'up' : 'down'}>
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </strong>
      </div>
      <div className="stat">
        <span>24H 高</span>
        <strong>{high ? formatNumber(high, 2) : '--'}</strong>
      </div>
      <div className="stat">
        <span>24H 低</span>
        <strong>{low ? formatNumber(low, 2) : '--'}</strong>
      </div>
      <div className="stat">
        <span>成交量</span>
        <strong>{volume ? formatNumber(volume, 2) : '--'}</strong>
      </div>
    </div>
  )
}
