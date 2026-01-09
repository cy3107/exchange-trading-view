import { useAtomValue } from 'jotai'
import { orderBookAtom } from '../state/marketAtoms'

// Live order book view driven by Jotai state.
export default function OrderBook() {
  const orderBook = useAtomValue(orderBookAtom)
  const bids = [...orderBook.bids].reverse()
  const asks = orderBook.asks

  return (
    <div className="panel">
      <h3>订单簿</h3>
      <div className="book">
        {asks.map(level => (
          <div key={`ask-${level.price}`} className="row">
            <span className="price sell">{level.price.toFixed(2)}</span>
            <span className="amount">{level.amount.toFixed(3)}</span>
          </div>
        ))}
        <div className="current">
          {orderBook.lastPrice ? orderBook.lastPrice.toFixed(2) : '--'}
        </div>
        {bids.map(level => (
          <div key={`bid-${level.price}`} className="row">
            <span className="price buy">{level.price.toFixed(2)}</span>
            <span className="amount">{level.amount.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
