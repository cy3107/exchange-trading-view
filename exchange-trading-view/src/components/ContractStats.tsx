import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { orderBookAtom, tickAtom, tradesAtom } from '../state/marketAtoms'

// Format numbers with fixed precision.
const formatNumber = (value: number, digits = 2) =>
  value.toLocaleString('en-US', { maximumFractionDigits: digits })

// Contract detail card: index price, mark price, funding.
export default function ContractStats() {
  const tick = useAtomValue(tickAtom)
  const orderBook = useAtomValue(orderBookAtom)
  const trades = useAtomValue(tradesAtom)

  const indexPrice = useMemo(() => {
    // 使用 tick 时间戳作为稳定时基，避免 render 中调用 Date.now
    if (!tick.price || !tick.timestamp) return 0
    const drift =
      (Math.sin(tick.timestamp / 12000) * 0.0008 + 1) * tick.price
    return drift
  }, [tick.price, tick.timestamp])

  const fundingRate = useMemo(() => {
    // 根据盘口偏斜与成交方向粗略估算资金费率
    if (!tick.price) return 0
    const bidDepth = orderBook.bids.reduce((sum, level) => sum + level.amount, 0)
    const askDepth = orderBook.asks.reduce((sum, level) => sum + level.amount, 0)
    const flow = trades.slice(0, 10).reduce((sum, trade) => {
      return sum + (trade.side === 'buy' ? trade.size : -trade.size)
    }, 0)
    const pressure = bidDepth - askDepth + flow
    return Math.max(-0.08, Math.min(0.08, pressure * 0.001))
  }, [orderBook, trades, tick.price])

  // Mark price follows latest tick in this demo.
  const markPrice = tick.price

  return (
    <div className="panel contract-stats">
      <h3>合约详情</h3>
      <div className="stat-grid">
        <div className="stat-item">
          <span>指数价</span>
          <strong>{indexPrice ? formatNumber(indexPrice, 2) : '--'}</strong>
        </div>
        <div className="stat-item">
          <span>标记价</span>
          <strong>{markPrice ? formatNumber(markPrice, 2) : '--'}</strong>
        </div>
        <div className="stat-item">
          <span>资金费率</span>
          <strong className={fundingRate >= 0 ? 'up' : 'down'}>
            {(fundingRate * 100).toFixed(4)}%
          </strong>
        </div>
        <div className="stat-item">
          <span>结算周期</span>
          <strong>8H</strong>
        </div>
      </div>
    </div>
  )
}
