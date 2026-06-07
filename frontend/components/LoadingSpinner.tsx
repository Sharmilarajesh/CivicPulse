import { Loader2 } from 'lucide-react'

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-4">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
  </div>
)

export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-content-bg">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl font-bold text-slate-800">
        Civic<span className="text-cyan-500">Pulse</span>
      </span>
    </div>
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
  </div>
)

export const ButtonSpinner = () => (
  <Loader2 className="w-4 h-4 animate-spin" />
)

export const SkeletonCard = () => (
  <div className="card p-5 w-full h-40 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className="w-24 h-6 rounded-full shimmer" />
      <div className="w-20 h-6 rounded-full shimmer" />
    </div>
    <div className="w-3/4 h-5 rounded shimmer" />
    <div className="w-full h-4 rounded shimmer" />
    <div className="w-full h-4 rounded shimmer" />
    <div className="mt-auto flex gap-4">
      <div className="w-24 h-4 rounded shimmer" />
      <div className="w-20 h-4 rounded shimmer" />
    </div>
  </div>
)
