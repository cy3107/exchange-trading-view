import { useEffect, useRef, useTransition } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  connectionAtom,
  orderBookAtom,
  positionsAtom,
  tickAtom,
  tradesAtom
} from '../state/marketAtoms'
import {
  applyOrderBookPatch,
  createOrderBookSnapshot,
  createTradesSnapshot,
  makeTrade,
  updatePositionsMark
} from '../services/marketData'

// Channel names for stream segregation.
type Channel = 'market' | 'trade' | 'account'
type Message =
  | {
      channel: Channel
      type: 'snapshot' | 'patch' | 'tick'
      seq: number
      payload: unknown
    }

// Baseline price for mock stream.
const BASE_PRICE = 62850

// Optionally create seq gaps to test snapshot reload.
const nextSeq = (current: number, allowGap = false) => {
  if (!allowGap) return current + 1
  return current + (Math.random() < 0.08 ? 2 : 1)
}

// Mock WS stream with seq validation, snapshots, patches, and reconnects.
export default function useMarketFeed() {
  const setOrderBook = useSetAtom(orderBookAtom)
  const setTrades = useSetAtom(tradesAtom)
  const setPositions = useSetAtom(positionsAtom)
  const positions = useAtomValue(positionsAtom)
  const positionsRef = useRef(positions)
  const setTick = useSetAtom(tickAtom)
  const setConnection = useSetAtom(connectionAtom)
  const [, startTransition] = useTransition()

  // Mutable refs for stream state.
  const seqRef = useRef({ market: 0, trade: 0, account: 0 })
  const lastSeqRef = useRef({ market: 0, trade: 0, account: 0 })
  const priceRef = useRef(BASE_PRICE)
  const orderBookRef = useRef(createOrderBookSnapshot(BASE_PRICE))
  const activeRef = useRef(true)

  // Keep positions available for snapshot generation.
  useEffect(() => {
    positionsRef.current = positions
  }, [positions])

  useEffect(() => {
    activeRef.current = true
    setConnection(prev => ({
      ...prev,
      status: 'connecting'
    }))

    // Central message handler with seq validation.
    const handleMessage = (message: Message) => {
      const lastSeq = lastSeqRef.current[message.channel]
      if (message.seq !== lastSeq + 1) {
        triggerSnapshot(message.channel)
        return
      }
      lastSeqRef.current[message.channel] = message.seq

      setConnection(prev => {
        if (message.channel === 'market') {
          return { ...prev, marketSeq: message.seq }
        }
        if (message.channel === 'trade') {
          return { ...prev, tradeSeq: message.seq }
        }
        return { ...prev, accountSeq: message.seq }
      })

      if (message.channel === 'market') {
        if (message.type === 'snapshot' || message.type === 'patch') {
          const book = message.payload as ReturnType<typeof createOrderBookSnapshot>
          orderBookRef.current = book
          startTransition(() => setOrderBook(book))
        } else {
          const tick = message.payload as { price: number; timestamp: number }
          setTick(tick)
          setPositions(prev => updatePositionsMark(prev, tick.price))
        }
      }

      if (message.channel === 'trade') {
        const trades = message.payload as ReturnType<typeof createTradesSnapshot>
        if (message.type === 'snapshot') {
          startTransition(() => setTrades(trades))
        } else {
          startTransition(() =>
            setTrades(prev => [...trades, ...prev].slice(0, 30))
          )
        }
      }

      if (message.channel === 'account') {
        const positions = message.payload as ReturnType<typeof updatePositionsMark>
        if (message.type === 'snapshot' || positions.length > 0) {
          setPositions(positions)
        }
      }
    }

    // Emit a full snapshot for the requested channel.
    const emitSnapshot = (channel: Channel) => {
      seqRef.current[channel] = nextSeq(seqRef.current[channel])
      const seq = seqRef.current[channel]

      if (channel === 'market') {
        const snapshot = createOrderBookSnapshot(priceRef.current)
        handleMessage({ channel, type: 'snapshot', seq, payload: snapshot })
      }

      if (channel === 'trade') {
        const snapshot = createTradesSnapshot(priceRef.current)
        handleMessage({ channel, type: 'snapshot', seq, payload: snapshot })
      }

      if (channel === 'account') {
        const snapshot = updatePositionsMark(positionsRef.current, priceRef.current)
        handleMessage({ channel, type: 'snapshot', seq, payload: snapshot })
      }

      setConnection(prev => ({
        ...prev,
        lastSnapshotAt: Date.now()
      }))
    }

    // Order book patch updates.
    const emitPatch = () => {
      seqRef.current.market = nextSeq(seqRef.current.market, true)
      const seq = seqRef.current.market
      const book = applyOrderBookPatch(orderBookRef.current, priceRef.current)
      handleMessage({ channel: 'market', type: 'patch', seq, payload: book })
    }

    // Tick updates for K-line and mark price.
    const emitTick = () => {
      seqRef.current.market = nextSeq(seqRef.current.market)
      const seq = seqRef.current.market
      const drift = (Math.random() - 0.5) * 20
      priceRef.current = Math.max(100, priceRef.current + drift)
      handleMessage({
        channel: 'market',
        type: 'tick',
        seq,
        payload: { price: priceRef.current, timestamp: Date.now() }
      })
    }

    // Single trade updates.
    const emitTrade = () => {
      seqRef.current.trade = nextSeq(seqRef.current.trade, true)
      const seq = seqRef.current.trade
      const trade = makeTrade(priceRef.current)
      handleMessage({
        channel: 'trade',
        type: 'patch',
        seq,
        payload: [trade]
      })
    }

    // Reset seq and re-sync from snapshot.
    const triggerSnapshot = (channel: Channel) => {
      lastSeqRef.current[channel] = 0
      emitSnapshot(channel)
    }

    // Initial snapshot sync for all channels.
    const startStream = () => {
      emitSnapshot('account')
      emitSnapshot('market')
      emitSnapshot('trade')

      setConnection(prev => ({ ...prev, status: 'connected' }))
    }

    // Simulate streaming intervals.
    let tickTimer = window.setInterval(emitTick, 1000)
    let patchTimer = window.setInterval(emitPatch, 1500)
    let tradeTimer = window.setInterval(emitTrade, 2000)
    let disconnectTimer = 0

    // Simulate disconnect/reconnect cycles.
    const disconnectCycle = () => {
      if (!activeRef.current) return
      window.clearInterval(tickTimer)
      window.clearInterval(patchTimer)
      window.clearInterval(tradeTimer)
      setConnection(prev => ({
        ...prev,
        status: 'disconnected',
        lastDisconnectAt: Date.now()
      }))

      window.setTimeout(() => {
        if (!activeRef.current) return
        setConnection(prev => ({ ...prev, status: 'reconnecting' }))
        startStream()
        tickTimer = window.setInterval(emitTick, 1000)
        patchTimer = window.setInterval(emitPatch, 1500)
        tradeTimer = window.setInterval(emitTrade, 2000)
        disconnectTimer = window.setTimeout(disconnectCycle, 24000)
      }, 2500)
    }

    startStream()
    disconnectTimer = window.setTimeout(disconnectCycle, 24000)

    return () => {
      activeRef.current = false
      window.clearInterval(tickTimer)
      window.clearInterval(patchTimer)
      window.clearInterval(tradeTimer)
      window.clearTimeout(disconnectTimer)
    }
  }, [setConnection, setOrderBook, setPositions, setTick, setTrades, startTransition])
}
