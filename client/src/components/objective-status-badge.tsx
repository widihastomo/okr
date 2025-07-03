import { cn } from "@/lib/utils";

interface ObjectiveStatusBadgeProps {
  status: string;
  className?: string;
}

export function ObjectiveStatusBadge({ status, className }: ObjectiveStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not_started':
        return {
          label: 'Belum Dimulai',
          color: 'bg-gray-100 text-gray-800 border border-gray-200',
          icon: '🔵'
        };
      case 'in_progress':
        return {
          label: 'Berlangsung',
          color: 'bg-blue-100 text-blue-800 border border-blue-200',
          icon: '⏳'
        };
      case 'on_track':
        return {
          label: 'Sesuai Target',
          color: 'bg-green-100 text-green-800 border border-green-200',
          icon: '🟢'
        };
      case 'at_risk':
        return {
          label: 'Berisiko',
          color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
          icon: '🟠'
        };
      case 'behind':
        return {
          label: 'Tertinggal',
          color: 'bg-orange-100 text-orange-800 border border-orange-200',
          icon: '🔴'
        };
      case 'paused':
        return {
          label: 'Dijeda',
          color: 'bg-gray-100 text-gray-800 border border-gray-200',
          icon: '🟡'
        };
      case 'canceled':
        return {
          label: 'Dibatalkan',
          color: 'bg-red-100 text-red-800 border border-red-200',
          icon: '⚫'
        };
      case 'completed':
        return {
          label: 'Selesai',
          color: 'bg-green-100 text-green-800 border border-green-200',
          icon: '🟣'
        };
      case 'partially_achieved':
        return {
          label: 'Tercapai Sebagian',
          color: 'bg-amber-100 text-amber-800 border border-amber-200',
          icon: '✅'
        };
      case 'not_achieved':
        return {
          label: 'Tidak Tercapai',
          color: 'bg-red-100 text-red-800 border border-red-200',
          icon: '🔴'
        };
      default:
        return {
          label: 'Tidak Diketahui',
          color: 'bg-gray-100 text-gray-800 border border-gray-200',
          icon: '❓'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}