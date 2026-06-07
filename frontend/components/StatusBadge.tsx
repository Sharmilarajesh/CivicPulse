import { statusConfig } from '@/types'
import { AlertCircle, Eye, UserCheck, Wrench, CheckCircle2 } from 'lucide-react'

const icons = {
  reported: AlertCircle,
  under_review: Eye,
  assigned: UserCheck,
  in_progress: Wrench,
  resolved: CheckCircle2
}

export const StatusBadge = ({ 
  status, 
  size = 'md' 
}: { 
  status: string, 
  size?: 'sm' | 'md' 
}) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.reported
  const Icon = icons[status as keyof typeof icons] || AlertCircle

  return (
    <span className={`inline-flex items-center gap-1.5 ${config.bg} ${config.text} border ${config.border} rounded-full font-medium shadow-sm transition-all hover:shadow
      ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
    `}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {config.label}
    </span>
  )
}
