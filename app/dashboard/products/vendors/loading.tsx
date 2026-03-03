export default function VendorsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-neutral-200 rounded animate-pulse" />
      </div>
      <div className="p-8 border rounded-lg bg-white">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="h-12 w-12 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
