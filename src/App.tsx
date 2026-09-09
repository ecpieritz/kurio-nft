import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { queryClient } from '@/lib/query/query-client'
import { anonymousAuthContext, type RouterAuthContext } from '@/router/context'
import { router } from '@/router'

interface AppProps {
  auth?: RouterAuthContext
}

export function App({ auth = anonymousAuthContext }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ auth }} />
    </QueryClientProvider>
  )
}
