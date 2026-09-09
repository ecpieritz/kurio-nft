import { useLocation, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useAuth } from '@/features/auth/session/use-auth'
import {
  getCurrentNavigationPath,
  rememberReturnTo,
} from '@/lib/auth/navigation-context'
import { cn } from '@/lib/utils'
import { useFavoritesQuery, useToggleFavoriteMutation } from './favorites-query'

interface FavoriteButtonProps {
  nftId: string
  showLabel?: boolean
  className?: string
}

export function FavoriteButton({ nftId, showLabel = false, className }: FavoriteButtonProps) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userId = auth.user?.id ?? null
  const favoritesQuery = useFavoritesQuery(userId)
  const mutation = useToggleFavoriteMutation(userId)
  const isFavorite = favoritesQuery.data?.nftIds.includes(nftId) ?? false
  const label = isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'

  function handleClick() {
    if (!userId) {
      const returnTo = rememberReturnTo(location.href) ?? getCurrentNavigationPath()
      void navigate({ to: '/login', search: { redirect: returnTo }, replace: true })
      return
    }

    mutation.mutate({ nftId, favorite: !isFavorite })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={showLabel ? 'default' : 'icon-sm'}
        aria-label={label}
        aria-pressed={isFavorite}
        title={label}
        disabled={mutation.isPending}
        className={cn(
          'border-primary/60 bg-background/85 text-primary backdrop-blur hover:bg-card',
          className,
        )}
        onClick={handleClick}
      >
        <Icon name={isFavorite ? 'heartBold' : 'heart'} className="size-4" />
        {showLabel && (isFavorite ? 'Favoritado' : 'Favoritar')}
      </Button>
      {mutation.isError && (
        <span role="alert" className="sr-only">
          {'N\u00e3o foi poss\u00edvel atualizar o favorito. O estado anterior foi restaurado.'}
        </span>
      )}
    </>
  )
}
