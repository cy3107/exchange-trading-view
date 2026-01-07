import { useMemo } from 'react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain
} from 'wagmi'
import { arbitrum, bsc, mainnet } from 'wagmi/chains'

const formatAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`

const chainName = (chainId?: number) => {
  if (!chainId) return 'Unknown'
  if (chainId === mainnet.id) return 'Ethereum'
  if (chainId === arbitrum.id) return 'Arbitrum'
  if (chainId === bsc.id) return 'BSC'
  return `Chain ${chainId}`
}

export default function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const preferred = useMemo(() => {
    return (
      connectors.find(connector => connector.id === 'metaMask') ||
      connectors.find(connector => connector.id === 'injected') ||
      connectors[0]
    )
  }, [connectors])

  const handleConnect = () => {
    if (!preferred) return
    connect({ connector: preferred })
  }

  const handleSwitch = () => {
    if (!switchChain) return
    const next =
      chainId === arbitrum.id ? mainnet.id : arbitrum.id
    switchChain({ chainId: next })
  }

  return (
    <div className="wallet-actions">
      {isConnected ? (
        <>
          <div className="wallet-chip">
            <span className="dot" />
            {chainName(chainId)}
          </div>
          <button className="wallet-button secondary" onClick={handleSwitch}>
            切换网络
          </button>
          <button className="wallet-button" onClick={() => disconnect()}>
            {formatAddress(address!)}
          </button>
        </>
      ) : (
        <button
          className="wallet-button"
          onClick={handleConnect}
          disabled={!preferred || isPending}
        >
          {isPending ? '连接中...' : 'Connect MetaMask'}
        </button>
      )}
    </div>
  )
}
