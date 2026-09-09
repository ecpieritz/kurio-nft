import { useMutation } from '@tanstack/react-query'

import { registerAccount } from '@/features/auth/registration/register-api'

export function useRegisterMutation() {
  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: registerAccount,
  })
}
