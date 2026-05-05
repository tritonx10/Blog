export function Spinner({ size = 'md', className = 'py-16' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-[3px] border-parchment-dark border-t-gold rounded-full animate-spin`}
      />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-48 bg-parchment-dark" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-parchment-dark rounded w-3/4" />
        <div className="h-3 bg-parchment-dark rounded w-full" />
        <div className="h-3 bg-parchment-dark rounded w-5/6" />
        <div className="h-3 bg-parchment-dark rounded w-2/3" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
