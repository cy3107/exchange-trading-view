import { useEffect, useRef } from 'react'
import { init, dispose } from 'klinecharts'
import { generateMockData } from '../mockData.ts'

interface Props {
  mode: 'spot' | 'perpetual'
}

export default function KlineChart({ mode }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = init(chartRef.current, { styles: 'dark' })
    if (!chart) return
    chart.applyNewData(generateMockData(mode === 'spot' ? 120 : 200))

    const timer = setInterval(() => {
      // 模拟实时推送
      const last = chart.getDataList().slice(-1)[0]
      if (last) {
        chart.updateData({
          ...last,
          close: last.close + (Math.random() - 0.5) * 100,
          timestamp: Date.now()
        })
      }
    }, 3000)

    return () => {
      clearInterval(timer)
      dispose(chart)
    }
  }, [mode])

  return <div ref={chartRef} style={{ height: '500px', width: '100%' }} />
}
