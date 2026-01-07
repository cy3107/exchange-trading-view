import { atom } from 'jotai'

export type OrderBookLevel = { price: number; amount: number }
export type OrderBookState = {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  lastPrice: number
  updatedAt: number
}

export type Trade = {
  id: string
  price: number
  size: number
  side: 'buy' | 'sell'
  timestamp: number
}

export type Position = {
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
}

export type Tick = { price: number; timestamp: number }

export type ConnectionState = {
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  marketSeq: number
  tradeSeq: number
  accountSeq: number
  lastSnapshotAt: number
  lastDisconnectAt: number
}

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
