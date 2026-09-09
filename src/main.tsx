import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import './index.css'
import { enableMocking } from './mocks/enable-mocking'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found')
}

const applicationRoot = createRoot(rootElement)

async function bootstrap(): Promise<void> {
  await enableMocking()

  applicationRoot.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
