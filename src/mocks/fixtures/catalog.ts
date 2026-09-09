import { nftArtwork, type NftArtworkName } from '@/assets/catalog'
import type {
  BlockchainNetwork,
  DecimalString,
  NftCategory,
  NftDetails,
  NftImage,
} from '@/lib/api/contracts'

interface NftSeed {
  id: string
  tokenId: string
  name: string
  artwork: NftArtworkName
  category: NftCategory
  network: BlockchainNetwork
  priceEth: DecimalString
  previousPriceEth?: DecimalString
  availableQuantity: number
  featured?: boolean
  rare?: boolean
}

const seeds = [
  {
    id: 'emerald-ape-042',
    tokenId: '#0042',
    name: 'Emerald Ape #042',
    artwork: 'emeraldApe',
    category: 'digital-art',
    network: 'ethereum',
    priceEth: '1.19',
    availableQuantity: 49,
    featured: true,
    rare: true,
  },
  {
    id: 'sage-nomad-009',
    tokenId: '#0009',
    name: 'Sage Nomad #009',
    artwork: 'violetNomad',
    category: 'photography',
    network: 'polygon',
    priceEth: '1.69',
    availableQuantity: 10,
    featured: true,
  },
  {
    id: 'neon-vessel-552',
    tokenId: '#0552',
    name: 'Neon Vessel #552',
    artwork: 'ivoryBaron',
    category: 'digital-art',
    network: 'ethereum',
    priceEth: '1.99',
    previousPriceEth: '2.29',
    availableQuantity: 4,
    rare: true,
  },
  {
    id: 'cosmic-bloom-118',
    tokenId: '#0118',
    name: 'Cosmic Bloom #118',
    artwork: 'violetNomad',
    category: 'generative',
    network: 'solana',
    priceEth: '1.29',
    availableQuantity: 8,
  },
  {
    id: 'violet-nomad-314',
    tokenId: '#0314',
    name: 'Violet Nomad #314',
    artwork: 'violetNomad',
    category: 'collectibles',
    network: 'polygon',
    priceEth: '1.39',
    availableQuantity: 12,
  },
  {
    id: 'ivory-baron-088',
    tokenId: '#0088',
    name: 'Ivory Baron #088',
    artwork: 'ivoryBaron',
    category: '3d-art',
    network: 'ethereum',
    priceEth: '1.79',
    availableQuantity: 10,
  },
  {
    id: 'golden-beat-207',
    tokenId: '#0207',
    name: 'Golden Beat #207',
    artwork: 'goldenBeat',
    category: 'music',
    network: 'polygon',
    priceEth: '0.99',
    availableQuantity: 50,
    featured: true,
  },
  {
    id: 'golden-frequency-071',
    tokenId: '#0071',
    name: 'Golden Frequency #071',
    artwork: 'violetNomad',
    category: 'music',
    network: 'ethereum',
    priceEth: '0.59',
    availableQuantity: 25,
  },
  {
    id: 'golden-signal-160',
    tokenId: '#0160',
    name: 'Golden Signal #160',
    artwork: 'goldenBeat',
    category: 'utility',
    network: 'solana',
    priceEth: '0.39',
    availableQuantity: 100,
  },
  {
    id: 'amber-genesis-011',
    tokenId: '#0011',
    name: 'Amber Genesis #011',
    artwork: 'emeraldApe',
    category: 'generative',
    network: 'polygon',
    priceEth: '3.20',
    availableQuantity: 1,
    rare: true,
  },
  {
    id: 'onyx-protocol-404',
    tokenId: '#0404',
    name: 'Onyx Protocol #404',
    artwork: 'ivoryBaron',
    category: 'utility',
    network: 'ethereum',
    priceEth: '0.72',
    availableQuantity: 30,
  },
  {
    id: 'velvet-orbit-219',
    tokenId: '#0219',
    name: 'Velvet Orbit #219',
    artwork: 'violetNomad',
    category: 'photography',
    network: 'solana',
    priceEth: '2.10',
    availableQuantity: 7,
  },
  {
    id: 'emerald-echo-512',
    tokenId: '#0512',
    name: 'Emerald Echo #512',
    artwork: 'emeraldApe',
    category: 'memberships',
    network: 'polygon',
    priceEth: '0.25',
    availableQuantity: 200,
  },
  {
    id: 'ivory-circuit-301',
    tokenId: '#0301',
    name: 'Ivory Circuit #301',
    artwork: 'ivoryBaron',
    category: 'games',
    network: 'ethereum',
    priceEth: '4.75',
    availableQuantity: 3,
    rare: true,
  },
  {
    id: 'golden-canvas-144',
    tokenId: '#0144',
    name: 'Golden Canvas #144',
    artwork: 'goldenBeat',
    category: 'digital-art',
    network: 'solana',
    priceEth: '0.84',
    availableQuantity: 18,
  },
  {
    id: 'violet-archive-825',
    tokenId: '#0825',
    name: 'Violet Archive #825',
    artwork: 'violetNomad',
    category: 'collectibles',
    network: 'polygon',
    priceEth: '6.40',
    availableQuantity: 2,
    rare: true,
  },
  {
    id: 'neon-muse-067',
    tokenId: '#0067',
    name: 'Neon Muse #067',
    artwork: 'ivoryBaron',
    category: '3d-art',
    network: 'ethereum',
    priceEth: '1.05',
    availableQuantity: 14,
  },
  {
    id: 'cosmic-ledger-777',
    tokenId: '#0777',
    name: 'Cosmic Ledger #777',
    artwork: 'goldenBeat',
    category: 'memberships',
    network: 'solana',
    priceEth: '0.18',
    availableQuantity: 300,
  },
] as const satisfies readonly NftSeed[]

function createImage(artwork: NftArtworkName, nftName: string): NftImage {
  const asset = nftArtwork[artwork]

  return {
    url: asset.src,
    alt: `${nftName}: ${asset.alt}`,
    width: asset.width,
    height: asset.height,
  }
}

function createNft(seed: NftSeed, index: number): NftDetails {
  const image = createImage(seed.artwork, seed.name)

  return {
    id: seed.id,
    tokenId: seed.tokenId,
    name: seed.name,
    collectionName: 'Kurio Apes',
    category: seed.category,
    network: seed.network,
    priceEth: seed.priceEth,
    previousPriceEth: seed.previousPriceEth,
    image,
    availableQuantity: seed.availableQuantity,
    featured: seed.featured ?? false,
    rare: seed.rare ?? false,
    version: 1,
    description: 'Um colecionável digital finalizado à mão da coleção Kurio Editions.',
    longDescription:
      'Cada atributo fica armazenado nos metadados do token e verificado na rede, preservando identidade, movimento e proveniência.',
    contractAddress: `0xKurio${String(index + 1).padStart(34, '0')}`,
    creatorRoyaltyPercentage: '5',
    attributes: ['Kurio Editions', seed.category, seed.rare ? 'Raro' : 'Verificado'],
    editions: [
      {
        id: `${seed.id}:1-1`,
        label: '1/1',
        minted: 0,
        supply: 1,
        availableQuantity: Math.min(seed.availableQuantity, 1),
        purchasable: seed.availableQuantity > 0,
      },
      {
        id: `${seed.id}:1-10`,
        label: '1/10',
        minted: Math.min(3, Math.max(0, 10 - seed.availableQuantity)),
        supply: 10,
        availableQuantity: Math.min(seed.availableQuantity, 10),
        purchasable: seed.availableQuantity > 0,
      },
      {
        id: `${seed.id}:1-50`,
        label: '1/50',
        minted: Math.max(0, 50 - seed.availableQuantity),
        supply: 50,
        availableQuantity: Math.min(seed.availableQuantity, 50),
        purchasable: seed.availableQuantity > 0,
      },
    ],
    gallery: [image, image, image, image],
    rating: index % 3 === 0 ? '4.8' : '4.6',
    reviewCount: 12 + index,
  }
}

export const nftFixtures: NftDetails[] = seeds.map(createNft)
