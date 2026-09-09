function shouldEnableMocking(): boolean {
  return import.meta.env.VITE_ENABLE_MOCKS !== 'false'
}

export async function enableMocking(): Promise<void> {
  if (!shouldEnableMocking()) return

  const { worker } = await import('@/mocks/browser')

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  })
}
