import { useLocation } from '@tanstack/react-router'

import { Seo } from '@/components/seo/seo'

const privateRoutePrefixes = ['/checkout', '/orders/', '/profile', '/wallets', '/favorites']

function getMetadata(pathname: string): { title: string; description: string } {
  if (pathname === '/') {
    return {
      title: 'Kurio',
      description: 'Descubra, favorite e colecione NFTs selecionados no marketplace Kurio.',
    }
  }
  if (pathname === '/marketplace') {
    return {
      title: 'Marketplace de NFTs',
      description: 'Explore o catálogo Kurio por coleção, rede, preço e lançamentos recentes.',
    }
  }
  if (pathname.startsWith('/nfts/')) {
    return {
      title: 'Detalhes do NFT',
      description: 'Conheça a obra, suas edições, atributos, disponibilidade e preço em ETH.',
    }
  }
  if (pathname === '/cart') {
    return {
      title: 'Carrinho de NFTs',
      description: 'Revise as edições e quantidades selecionadas para sua coleção.',
    }
  }
  if (pathname === '/login') {
    return { title: 'Entrar', description: 'Entre na sua conta de colecionador Kurio.' }
  }
  if (pathname === '/sign-up') {
    return { title: 'Criar conta', description: 'Crie seu perfil de colecionador na Kurio.' }
  }
  if (pathname === '/checkout') {
    return { title: 'Pagamento', description: 'Revise e confirme sua compra de NFTs.' }
  }
  if (pathname.startsWith('/orders/')) {
    return { title: 'Pedido', description: 'Acompanhe o estado e o recibo da sua compra.' }
  }
  if (pathname === '/profile') {
    return { title: 'Perfil do colecionador', description: 'Gerencie seus dados de colecionador.' }
  }
  if (pathname === '/wallets') {
    return { title: 'Carteiras', description: 'Gerencie suas carteiras e redes cadastradas.' }
  }
  if (pathname === '/favorites') {
    return { title: 'Lista de interesse', description: 'Veja os NFTs salvos na sua lista.' }
  }

  return { title: 'Página não encontrada', description: 'A página solicitada não foi encontrada.' }
}

export function RouteMetadata() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const metadata = getMetadata(pathname)
  const noIndex =
    pathname === '/login' ||
    pathname === '/sign-up' ||
    pathname === '/cart' ||
    privateRoutePrefixes.some((prefix) => pathname.startsWith(prefix))

  return <Seo {...metadata} path={pathname} noIndex={noIndex} />
}
