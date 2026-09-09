export function CatalogSkeleton() {
  return (
    <div
      aria-label="Carregando NFTs"
      role="status"
      className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10"
    >
      {Array.from({ length: 9 }, (_, index) => (
        <div key={index} className="min-w-0" aria-hidden="true">
          <div className="skeleton-shimmer aspect-square rounded-card bg-card" />
          <div className="skeleton-shimmer mt-3 h-4 w-4/5 rounded bg-card" />
          <div className="skeleton-shimmer mt-2 h-4 w-2/5 rounded bg-card" />
        </div>
      ))}
      <span className="sr-only">{'Carregando cat\u00e1logo de NFTs'}</span>
    </div>
  )
}
