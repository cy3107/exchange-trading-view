import { useAtomValue } from 'jotai'
import { tradesAtom } from '../state/marketAtoms'

// Recent trade tape panel.
export default function TradeList() {
  const trades = useAtomValue(tradesAtom)

  return (
    <div className="panel trades">
      <h3>成交</h3>
      <div className="trades-list">
        {trades.map(trade => (
          <div className="trade-row" key={trade.id}>
            <span className={trade.side === 'buy' ? 'buy' : 'sell'}>
              {trade.side === 'buy' ? '买' : '卖'}
            </span>
            <span>{trade.price.toFixed(2)}</span>
            <span>{trade.size.toFixed(3)}</span>
            <span className="time">
              {new Date(trade.timestamp).toLocaleTimeString('zh-CN', {
                hour12: false
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
