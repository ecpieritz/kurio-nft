import type {
  BlockchainNetwork,
  EntityId,
  ISODateString,
  VersionedResource,
  WalletAddress,
} from '@/lib/api/contracts/common'

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase'

export interface CollectorWallet extends VersionedResource {
  id: EntityId
  userId: EntityId
  displayName: string
  nickname: string
  profileName: string
  email: string
  address: WalletAddress
  ensName: string | null
  referralCode: string
  network: BlockchainNetwork
  provider: WalletProvider
  primary: boolean
  updatedAt: ISODateString
}

export interface SaveWalletRequest {
  displayName: string
  nickname: string
  profileName: string
  email: string
  address: WalletAddress
  ensName?: string
  referralCode: string
  network: BlockchainNetwork
  provider: WalletProvider
  primary: boolean
  expectedVersion?: number
}

export interface WalletCollection {
  items: CollectorWallet[]
}
