import { useState } from 'react'
import { useAtomValue } from 'jotai'
import { useAccount } from 'wagmi'
import KlineChart from './components/KlineChart'
import OrderBook from './components/OrderBook'
import DepthChart from './components/DepthChart'
import RevokeButton from './components/RevokeButton'
import OrderForm from './components/OrderForm'
import Positions from './components/Positions'
import TradeList from './components/TradeList'
import MarketStats from './components/MarketStats'
import WalletButton from './components/WalletButton'
import ContractStats from './components/ContractStats'
import useMarketFeed from './hooks/useMarketFeed'
import { connectionAtom } from './state/marketAtoms'
import './App.css'

// Main trading layout.
function App() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<'spot' | 'perpetual'>('perpetual')
  const connection = useAtomValue(connectionAtom)

  // Start mock streaming data.
  useMarketFeed()

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">Zhi Exchange</div>
          <div className="subtitle">Perpetual Trading Desk</div>
        </div>
        <div className="tabs">
          <button className={tab === 'spot' ? 'active' : ''} onClick={() => setTab('spot')}>现货</button>
          <button className={tab === 'perpetual' ? 'active' : ''} onClick={() => setTab('perpetual')}>永续合约</button>
        </div>
        <div className={`status ${connection.status}`}>
          {connection.status === 'connected' ? '已连接' : '同步中'}
        </div>
        <div className="wallet">
          <WalletButton />
          {isConnected && <RevokeButton address={address!} />}
        </div>
      </header>

      <section className="top-bar">
        <MarketStats />
      </section>

      <main className="main">
        <div className="left">
          <div className="panel kline-panel">
            <KlineChart mode={tab} />
          </div>
          <OrderForm />
          <Positions />
        </div>
        <div className="right">
          <ContractStats />
          <OrderBook />
          <DepthChart />
          <TradeList />
        </div>
      </main>

      <footer className="footer">
        {isConnected ? `已连接: ${address!.slice(0, 6)}...${address!.slice(-4)}` : '未连接钱包'}
        <span className="divider">·</span>
        <span>
          seq: m{connection.marketSeq} t{connection.tradeSeq} a{connection.accountSeq}
        </span>
      </footer>
    </div>
  )
}

export default App
