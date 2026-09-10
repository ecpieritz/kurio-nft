import { build, preview } from 'vite'

await build()

const server = await preview({
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
})

async function closeServer() {
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => (error ? reject(error) : resolve()))
  })
}

process.once('SIGINT', () => void closeServer().finally(() => process.exit(0)))
process.once('SIGTERM', () => void closeServer().finally(() => process.exit(0)))
