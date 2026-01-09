import { atom } from 'jotai'

// Order book snapshots used by orderbook/depth components.
export type OrderBookLevel = { price: number; amount: number }
export type OrderBookState = {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  lastPrice: number
  updatedAt: number
}

// Recent trade tape entries.
export type Trade = {
  id: string
  price: number
  size: number
  side: 'buy' | 'sell'
  timestamp: number
}

// Perpetual position summary (single symbol demo).
export type Position = {
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
}

// Last trade tick for K-line synthesis.
export type Tick = { price: number; timestamp: number }

// WebSocket connection state + per-channel seqs.
export type ConnectionState = {
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  marketSeq: number
  tradeSeq: number
  accountSeq: number
  lastSnapshotAt: number
  lastDisconnectAt: number
}

// Shared atoms for market data flow.
export const orderBookAtom = atom<OrderBookState>({
  bids: [],
  asks: [],
  lastPrice: 0,
  updatedAt: 0
})

export const tradesAtom = atom<Trade[]>([])

export const positionsAtom = atom<Position[]>([])

export const tickAtom = atom<Tick>({ price: 0, timestamp: 0 })

export const connectionAtom = atom<ConnectionState>({
  status: 'connecting',
  marketSeq: 0,
  tradeSeq: 0,
  accountSeq: 0,
  lastSnapshotAt: 0,
  lastDisconnectAt: 0
})
