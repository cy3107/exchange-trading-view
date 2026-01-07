import { useAtomValue } from 'jotai'
import { positionsAtom } from '../state/marketAtoms'

export default function Positions() {
  const positions = useAtomValue(positionsAtom)

  return (
    <div className="panel positions">
      <h3>仓位</h3>
      {positions.length === 0 ? (
        <div className="empty">暂无仓位</div>
      ) : (
        <div className="positions-table">
          {positions.map(position => (
            <div className="position-row" key={position.symbol}>
              <span>{position.symbol}</span>
              <span className={position.side === 'long' ? 'buy' : 'sell'}>
                {position.side === 'long' ? '多' : '空'}
              </span>
              <span>{position.size.toFixed(3)}</span>
              <span>{position.entryPrice.toFixed(2)}</span>
              <span className={position.pnl >= 0 ? 'pnl up' : 'pnl down'}>
                {position.pnl >= 0 ? '+' : ''}
                {position.pnl.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
