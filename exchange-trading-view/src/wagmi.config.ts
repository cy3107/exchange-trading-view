import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, bsc, arbitrum } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

// Wagmi config for injected wallets (MetaMask-first).
export const config = createConfig({
  chains: [mainnet, sepolia, bsc, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
  },
  // Prefer MetaMask, fall back to generic injected provider.
  connectors: [metaMask(), injected()],
})
