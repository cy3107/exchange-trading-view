import type {
  OrderBookLevel,
  OrderBookState,
  Position,
  Trade
} from '../state/marketAtoms'

// Demo symbol for all generated data.
const SYMBOL = 'BTC-PERP'

// Simple ID helper for mock data.
const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`

// Numeric rounding helper for stable UI.
const round = (value: number, decimals = 2) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

// Create a full order book snapshot around a mid price.
export const createOrderBookSnapshot = (
  midPrice: number,
  depth = 10
): OrderBookState => {
  const bids = createLevels(midPrice, depth, 'bid')
  const asks = createLevels(midPrice, depth, 'ask')

  return {
    bids,
    asks,
    lastPrice: midPrice,
    updatedAt: Date.now()
  }
}

// Build ladder levels for a side.
const createLevels = (
  midPrice: number,
  depth: number,
  side: 'bid' | 'ask'
): OrderBookLevel[] => {
  const step = 5
  return Array.from({ length: depth }, (_, index) => {
    const delta = step * (index + 1)
    const price = side === 'bid' ? midPrice - delta : midPrice + delta
    const amount = round(2 + Math.random() * 6, 3)
    return { price, amount }
  })
}

// Apply a patch to the existing book to simulate streaming updates.
export const applyOrderBookPatch = (
  book: OrderBookState,
  midPrice: number
): OrderBookState => {
  const mutate = (levels: OrderBookLevel[]) =>
    levels.map(level => ({
      ...level,
      amount: round(Math.max(0.2, level.amount + (Math.random() - 0.5)), 3)
    }))

  const bids = mutate(book.bids)
  const asks = mutate(book.asks)

  return {
    ...book,
    bids,
    asks,
    lastPrice: midPrice,
    updatedAt: Date.now()
  }
}

// Create a snapshot list of recent trades.
export const createTradesSnapshot = (
  midPrice: number,
  count = 20
): Trade[] => {
  return Array.from({ length: count }, () => makeTrade(midPrice))
}

// Create a single mock trade around mid.
export const makeTrade = (midPrice: number): Trade => {
  const side = Math.random() > 0.5 ? 'buy' : 'sell'
  const drift = (Math.random() - 0.5) * 30
  const price = round(midPrice + drift, 2)
  return {
    id: makeId(),
    price,
    size: round(0.05 + Math.random() * 0.5, 3),
    side,
    timestamp: Date.now()
  }
}

// Reprice positions based on mark price.
export const updatePositionsMark = (
  positions: Position[],
  markPrice: number
): Position[] => {
  return positions.map(position => ({
    ...position,
    markPrice,
    pnl: calcPnl(position, markPrice)
  }))
}

// Merge a new order into the position model (single net position).
export const upsertPosition = (
  positions: Position[],
  order: { side: 'buy' | 'sell'; price: number; size: number }
): Position[] => {
  const side = order.side === 'buy' ? 'long' : 'short'
  const existing = positions[0]
  if (!existing) {
    return [
      {
        symbol: SYMBOL,
        side,
        size: order.size,
        entryPrice: order.price,
        markPrice: order.price,
        pnl: 0
      }
    ]
  }

  if (existing.side === side) {
    const newSize = existing.size + order.size
    const weighted =
      (existing.entryPrice * existing.size + order.price * order.size) / newSize
    return [
      {
        ...existing,
        size: round(newSize, 3),
        entryPrice: round(weighted, 2),
        markPrice: order.price,
        pnl: calcPnl({ ...existing, size: newSize, entryPrice: weighted }, order.price)
      }
    ]
  }

  const reducedSize = existing.size - order.size
  if (reducedSize > 0) {
    return [
      {
        ...existing,
        size: round(reducedSize, 3),
        markPrice: order.price,
        pnl: calcPnl({ ...existing, size: reducedSize }, order.price)
      }
    ]
  }

  if (reducedSize < 0) {
    const newSize = Math.abs(reducedSize)
    return [
      {
        symbol: SYMBOL,
        side,
        size: round(newSize, 3),
        entryPrice: order.price,
        markPrice: order.price,
        pnl: 0
      }
    ]
  }

  return []
}

// Convert a user order into a trade entry.
export const makeTradeFromOrder = (order: {
  side: 'buy' | 'sell'
  price: number
  size: number
}): Trade => {
  return {
    id: makeId(),
    price: round(order.price, 2),
    size: round(order.size, 3),
    side: order.side,
    timestamp: Date.now()
  }
}

// Compute unrealized pnl for a position.
const calcPnl = (position: Position, markPrice: number) => {
  const diff =
    position.side === 'long'
      ? markPrice - position.entryPrice
      : position.entryPrice - markPrice
  return round(diff * position.size, 2)
}
