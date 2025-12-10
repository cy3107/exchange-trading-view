import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import KlineChart from './components/KlineChart'
import OrderBook from './components/OrderBook'
import DepthChart from './components/DepthChart'
import RevokeButton from './components/RevokeButton'
import './App.css'

function App() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<'spot' | 'perpetual'>('perpetual')

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Zhi Exchange</div>
        <div className="tabs">
          <button className={tab === 'spot' ? 'active' : ''} onClick={() => setTab('spot')}>现货</button>
          <button className={tab === 'perpetual' ? 'active' : ''} onClick={() => setTab('perpetual')}>永续合约</button>
        </div>
        <div className="wallet">
          <ConnectButton />
          {isConnected && <RevokeButton address={address!} />}
        </div>
      </header>

      <main className="main">
        <div className="left">
          <KlineChart mode={tab} />
        </div>
        <div className="right">
          <OrderBook />
          <DepthChart />
        </div>
      </main>

      <footer className="footer">
        {isConnected ? `已连接: ${address!.slice(0, 6)}...${address!.slice(-4)}` : '未连接钱包'}
      </footer>
    </div>
  )
}

export default App
