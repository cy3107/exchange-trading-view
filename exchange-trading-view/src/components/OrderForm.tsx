import { useEffect, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { positionsAtom, tickAtom, tradesAtom } from '../state/marketAtoms'
import { makeTradeFromOrder, upsertPosition } from '../services/marketData'

// Simplified order entry for demo.
export default function OrderForm() {
  const tick = useAtomValue(tickAtom)
  const setPositions = useSetAtom(positionsAtom)
  const setTrades = useSetAtom(tradesAtom)

  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [price, setPrice] = useState<number>(tick.price || 62850)
  const [size, setSize] = useState<number>(0.05)

  useEffect(() => {
    // Keep market order price synced with latest tick.
    if (orderType === 'market' && tick.price) {
      setPrice(tick.price)
    }
  }, [orderType, tick.price])

  // Apply order to position + trade tape.
  const submitOrder = () => {
    const execPrice = orderType === 'market' ? tick.price : price
    if (!execPrice || size <= 0) return

    setPositions(prev =>
      upsertPosition(prev, { side, price: execPrice, size })
    )
    setTrades(prev => [
      makeTradeFromOrder({ side, price: execPrice, size }),
      ...prev
    ].slice(0, 30))
  }

  return (
    <div className="panel order-form">
      <h3>下单</h3>
      <div className="order-row">
        <button
          className={side === 'buy' ? 'active buy' : ''}
          onClick={() => setSide('buy')}
        >
          做多
        </button>
        <button
          className={side === 'sell' ? 'active sell' : ''}
          onClick={() => setSide('sell')}
        >
          做空
        </button>
      </div>
      <div className="order-row">
        <button
          className={orderType === 'market' ? 'active' : ''}
          onClick={() => setOrderType('market')}
        >
          市价
        </button>
        <button
          className={orderType === 'limit' ? 'active' : ''}
          onClick={() => setOrderType('limit')}
        >
          限价
        </button>
      </div>
      <label className="order-field">
        <span>价格</span>
        <input
          type="number"
          step="0.1"
          value={price || ''}
          onChange={event => setPrice(Number(event.target.value))}
          disabled={orderType === 'market'}
        />
      </label>
      <label className="order-field">
        <span>数量</span>
        <input
          type="number"
          step="0.01"
          value={size}
          onChange={event => setSize(Number(event.target.value))}
        />
      </label>
      <button className="submit-order" onClick={submitOrder}>
        {side === 'buy' ? '买入开多' : '卖出开空'}
      </button>
    </div>
  )
}
