import { Button } from '@/components/ui/button'

export function App() {
  return (
    <main className="grid min-h-svh place-content-center gap-6 bg-background p-8 text-center text-foreground">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Kurio NFT Marketplace</h1>
        <p className="text-muted-foreground">Tailwind CSS and shadcn/ui are ready.</p>
      </div>
      <Button type="button">Explore marketplace</Button>
    </main>
  )
}
