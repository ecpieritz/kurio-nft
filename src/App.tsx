import { RouterProvider } from '@tanstack/react-router'

import { anonymousAuthContext, type RouterAuthContext } from '@/router/context'
import { router } from '@/router'

interface AppProps {
  auth?: RouterAuthContext
}

export function App({ auth = anonymousAuthContext }: AppProps) {
  return <RouterProvider router={router} context={{ auth }} />
}
