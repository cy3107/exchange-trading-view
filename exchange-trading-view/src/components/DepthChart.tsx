// src/components/DepthChart.tsx
import { useEffect, useRef } from 'react'
import './DepthChart.css'

type DepthPoint = { price: number; amount: number }

const initialBids: DepthPoint[] = [
  { price: 62850, amount: 12.5 },
  { price: 62840, amount: 18.3 },
  { price: 62830, amount: 25.1 },
  { price: 62820, amount: 32.7 },
  { price: 62810, amount: 41.2 },
  { price: 62800, amount: 58.9 }
]

const initialAsks: DepthPoint[] = [
  { price: 62860, amount: 15.4 },
  { price: 62870, amount: 22.1 },
  { price: 62880, amount: 28.8 },
  { price: 62890, amount: 35.6 },
  { price: 62900, amount: 44.3 },
  { price: 62910, amount: 62.1 }
]

export default function DepthChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bidsRef = useRef<DepthPoint[]>(initialBids)
  const asksRef = useRef<DepthPoint[]>(initialAsks)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const accumulate = (points: DepthPoint[]) => {
      let total = 0
      return points.map(point => {
        const amount = Math.max(point.amount, 0.5)
        total += amount
        return { ...point, amount, total }
      })
    }

    const drawChart = () => {
      const width = canvas.clientWidth || canvas.width
      const height = canvas.clientHeight || canvas.height
      if (!width || !height) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const padding = 32
      const chartWidth = width - padding * 2
      const chartHeight = height - padding * 2
      const midX = padding + chartWidth / 2
      const bids = accumulate(bidsRef.current)
      const asks = accumulate(asksRef.current)
      const maxTotal = Math.max(
        bids[bids.length - 1]?.total ?? 0,
        asks[asks.length - 1]?.total ?? 0
      ) || 1
      const minPrice = bids[bids.length - 1]?.price ?? 0
      const maxPrice = asks[asks.length - 1]?.price ?? minPrice + 1
      const priceRange = maxPrice - minPrice || 1

      const priceToY = (price: number) => {
        return height - padding - ((price - minPrice) / priceRange) * chartHeight
      }

      const drawDepthArea = (
        data: ReturnType<typeof accumulate>,
        side: 'bid' | 'ask',
        color: { stroke: string; fill: string }
      ) => {
        ctx.fillStyle = color.fill
        ctx.strokeStyle = color.stroke
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(midX, height - padding)
        data.forEach((item, index) => {
          const ratio = item.total / maxTotal
          const offset = (chartWidth / 2) * ratio
          const x = side === 'bid' ? midX - offset : midX + offset
          const y = priceToY(item.price)
          if (index === 0) {
            ctx.lineTo(x, height - padding)
          }
          ctx.lineTo(x, y)
        })
        ctx.lineTo(
          side === 'bid' ? padding : width - padding,
          height - padding
        )
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      // axes
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, padding)
      ctx.lineTo(padding, height - padding)
      ctx.lineTo(width - padding, height - padding)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(midX, padding)
      ctx.lineTo(midX, height - padding)
      ctx.stroke()

      drawDepthArea(bids, 'bid', {
        stroke: '#26a69a',
        fill: 'rgba(38, 166, 154, 0.25)'
      })
      drawDepthArea(asks, 'ask', {
        stroke: '#ef5350',
        fill: 'rgba(239, 83, 80, 0.25)'
      })

      // current price guide
      const midPrice = ((maxPrice + minPrice) / 2).toFixed(2)
      const priceY = priceToY((maxPrice + minPrice) / 2)
      ctx.strokeStyle = '#00d4aa'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(padding, priceY)
      ctx.lineTo(width - padding, priceY)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#00d4aa'
      ctx.font = 'bold 16px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`$${midPrice}`, midX, priceY - 8)
    }

    const resizeObserver = new ResizeObserver(() => drawChart())
    resizeObserver.observe(canvas)
    drawChart()

    const timer = setInterval(() => {
      bidsRef.current = bidsRef.current.map(point => ({
        ...point,
        amount: Math.max(0.5, point.amount + (Math.random() - 0.5) * 5)
      }))
      asksRef.current = asksRef.current.map(point => ({
        ...point,
        amount: Math.max(0.5, point.amount + (Math.random() - 0.5) * 5)
      }))
      drawChart()
    }, 3500)

    return () => {
      resizeObserver.disconnect()
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="panel">
      <h3>市场深度图</h3>
      <canvas ref={canvasRef} style={{ width: '100%', height: '300px' }} />
    </div>
  )
}
