import { useMutation } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/session/use-auth'

export function useRegisterMutation() {
  const auth = useAuth()

  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: auth.register,
  })
}
