import type { BlockchainNetwork, NftCategory, NftSort } from '@/lib/api/contracts'

export const categoryOptions = [
  { value: 'digital-art', label: 'Arte digital' },
  { value: 'photography', label: 'Fotografia' },
  { value: 'music', label: 'M\u00fasica' },
  { value: '3d-art', label: 'Arte 3D' },
  { value: 'collectibles', label: 'Colecion\u00e1veis' },
  { value: 'generative', label: 'Generativa' },
  { value: 'games', label: 'Jogos' },
  { value: 'memberships', label: 'Assinaturas' },
  { value: 'utility', label: 'Utilidade' },
] as const satisfies ReadonlyArray<{ value: NftCategory; label: string }>

export const networkOptions = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
] as const satisfies ReadonlyArray<{ value: BlockchainNetwork; label: string }>

export const sortOptions = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'popular', label: 'Mais populares' },
  { value: 'price-asc', label: 'Menor pre\u00e7o' },
  { value: 'price-desc', label: 'Maior pre\u00e7o' },
] as const satisfies ReadonlyArray<{ value: NftSort; label: string }>
