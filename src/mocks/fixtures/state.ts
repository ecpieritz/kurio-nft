import type {
  Cart,
  CollectorProfile,
  CollectorWallet,
  FavoriteCollection,
  Order,
} from '@/lib/api/contracts'
import type { MockDatabaseState, MockUserRecord } from '@/mocks/database/types'
import { nftFixtures } from '@/mocks/fixtures/catalog'

const createdAt = '2026-07-29T14:00:00.000Z'

const users: MockUserRecord[] = [
  {
    id: 'user-collector-01',
    username: 'novakurio',
    displayName: 'Nova Kurio',
    email: 'nova@kurio.test',
    normalizedEmail: 'nova@kurio.test',
    avatarUrl: '/images/monkey-01.png',
    passwordDigest: '5967c16c2022d4e40c36c348638237f3846e004c5f74dcde8aa0373f383aa8d4',
    createdAt,
  },
  {
    id: 'user-collector-02',
    username: 'orioncollector',
    displayName: 'Orion Collector',
    email: 'orion@kurio.test',
    normalizedEmail: 'orion@kurio.test',
    avatarUrl: '/images/monkey-03.png',
    passwordDigest: 'eef2db02a3a04e1959bb94d4af08e93176026f33377cebc5c5e34c5caeff155b',
    createdAt,
  },
]

const profiles: CollectorProfile[] = [
  {
    userId: users[0].id,
    displayName: users[0].displayName,
    username: users[0].username,
    email: users[0].email,
    ensName: 'nova.kurio.eth',
    walletNickname: 'Reserva',
    avatarUrl: users[0].avatarUrl,
    version: 1,
    updatedAt: createdAt,
  },
  {
    userId: users[1].id,
    displayName: users[1].displayName,
    username: users[1].username,
    email: users[1].email,
    ensName: 'orion.kurio.eth',
    walletNickname: 'Principal',
    avatarUrl: users[1].avatarUrl,
    version: 1,
    updatedAt: createdAt,
  },
]

const wallets: CollectorWallet[] = [
  {
    id: 'wallet-nova-primary',
    userId: users[0].id,
    displayName: 'Nova Kurio',
    nickname: 'Reserva',
    profileName: 'nova.kurio.eth',
    email: users[0].email,
    address: '0xA91F00000000000000000000000000000000E82C',
    ensName: 'nova.kurio.eth',
    referralCode: 'KURIO-NOVA',
    network: 'polygon',
    provider: 'coinbase',
    primary: true,
    version: 1,
    updatedAt: createdAt,
  },
  {
    id: 'wallet-nova-secondary',
    userId: users[0].id,
    displayName: 'Nova Kurio',
    nickname: 'Principal',
    profileName: 'nova.eth',
    email: users[0].email,
    address: '0xB82C00000000000000000000000000000000A91F',
    ensName: 'nova.eth',
    referralCode: 'KURIO-NOVA-2',
    network: 'ethereum',
    provider: 'metamask',
    primary: false,
    version: 1,
    updatedAt: createdAt,
  },
  {
    id: 'wallet-orion-primary',
    userId: users[1].id,
    displayName: 'Orion Collector',
    nickname: 'Principal',
    profileName: 'orion.kurio.eth',
    email: users[1].email,
    address: '0xC71D00000000000000000000000000000000F20A',
    ensName: 'orion.kurio.eth',
    referralCode: 'KURIO-ORION',
    network: 'ethereum',
    provider: 'walletconnect',
    primary: true,
    version: 1,
    updatedAt: createdAt,
  },
]

const favorites: FavoriteCollection[] = [
  { nftIds: ['emerald-ape-042', 'golden-beat-207'], version: 1 },
  { nftIds: ['ivory-baron-088'], version: 1 },
]

const carts: Cart[] = [
  {
    id: 'cart-visitor-default',
    userId: null,
    visitorId: 'visitor-default',
    items: [],
    version: 1,
    updatedAt: createdAt,
  },
  {
    id: 'cart-nova',
    userId: users[0].id,
    visitorId: null,
    items: [
      {
        id: 'cart-item-emerald',
        nftId: nftFixtures[0].id,
        editionId: `${nftFixtures[0].id}:1-50`,
        tokenId: nftFixtures[0].tokenId,
        name: nftFixtures[0].name,
        image: nftFixtures[0].image,
        unitPriceEth: nftFixtures[0].priceEth,
        quantity: 1,
        availableQuantity: nftFixtures[0].availableQuantity,
        priceChanged: false,
        availabilityChanged: false,
        version: 1,
      },
    ],
    version: 1,
    updatedAt: createdAt,
  },
  {
    id: 'cart-orion',
    userId: users[1].id,
    visitorId: null,
    items: [],
    version: 1,
    updatedAt: createdAt,
  },
]

const orders: Order[] = [
  {
    id: 'order-confirmed-fixture',
    userId: users[0].id,
    status: 'confirmed',
    version: 2,
    createdAt,
    updatedAt: '2026-07-29T14:00:03.000Z',
    receipt: {
      transactionReference: '0xA91F...E82C',
      explorerUrl: 'https://explorer.kurio.test/tx/0xA91FE82C',
      walletAddress: wallets[0].address,
      walletProvider: wallets[0].provider,
      confirmedAt: '2026-07-29T14:00:03.000Z',
      items: [],
      subtotalEth: '0',
      discountEth: '0',
      networkFeeEth: '0.016',
      totalEth: '0.016',
    },
  },
  {
    id: 'order-declined-fixture',
    userId: users[1].id,
    status: 'declined',
    version: 2,
    createdAt,
    updatedAt: '2026-07-29T14:00:03.000Z',
    receipt: null,
    declineReason: 'Payment was declined by the simulated wallet.',
  },
]

export function createKnownDatabaseState(): MockDatabaseState {
  return {
    schemaVersion: 1,
    revision: 1,
    users,
    sessions: [],
    nfts: nftFixtures,
    favoritesByUser: {
      [users[0].id]: favorites[0],
      [users[1].id]: favorites[1],
    },
    carts,
    quotes: [],
    orders,
    profilesByUser: {
      [users[0].id]: profiles[0],
      [users[1].id]: profiles[1],
    },
    walletsByUser: {
      [users[0].id]: wallets.filter((wallet) => wallet.userId === users[0].id),
      [users[1].id]: wallets.filter((wallet) => wallet.userId === users[1].id),
    },
    coupons: [
      {
        code: 'KURIO10',
        discountPercent: 10,
        expiresAt: '2027-01-01T00:00:00.000Z',
        enabled: true,
      },
      {
        code: 'GENESIS',
        discountPercent: 15,
        expiresAt: '2025-01-01T00:00:00.000Z',
        enabled: true,
      },
    ],
    idempotencyRecords: [],
  }
}
