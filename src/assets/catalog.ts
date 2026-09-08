export interface ImageAsset {
  src: string
  alt: string
  width: number
  height: number
}

export const nftArtwork = {
  emeraldApe: {
    src: '/images/monkey-01.png',
    alt: 'Emerald Ape wearing round sunglasses and a green varsity jacket',
    width: 1254,
    height: 1254,
  },
  violetNomad: {
    src: '/images/monkey-02.png',
    alt: 'Violet Nomad wearing an olive bucket hat and a purple hoodie',
    width: 1254,
    height: 1254,
  },
  ivoryBaron: {
    src: '/images/monkey-03.png',
    alt: 'Ivory Baron wearing an ivory suit over a dark turtleneck',
    width: 1254,
    height: 1254,
  },
  goldenBeat: {
    src: '/images/monkey-04.png',
    alt: 'Golden Beat wearing green headphones and a cream jacket',
    width: 1254,
    height: 1254,
  },
} as const satisfies Record<string, ImageAsset>

export const iconAssets = {
  activity: '/images/icons/ic-activity.svg',
  cart: '/images/icons/ic-cart.svg',
  cartBold: '/images/icons/ic-cart-bold.svg',
  danger: '/images/icons/ic-danger.svg',
  download: '/images/icons/ic-download.svg',
  heart: '/images/icons/ic-heart.svg',
  heartBold: '/images/icons/ic-heart-bold.svg',
  homeBold: '/images/icons/ic-home-bold.svg',
  image: '/images/icons/ic-image.svg',
  location: '/images/icons/ic-location.svg',
  logout: '/images/icons/ic-logout.svg',
  search: '/images/icons/ic-search.svg',
  thankYou: '/images/icons/ic-thank-you.svg',
  user: '/images/icons/ic-user.svg',
  userBold: '/images/icons/ic-user-bold.svg',
} as const

export type NftArtworkName = keyof typeof nftArtwork
export type IconName = keyof typeof iconAssets
