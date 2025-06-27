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
          label: 'Not Started',
          color: 'bg-blue-500 text-white',
          icon: '🔵'
        };
      case 'on_track':
        return {
          label: 'On Track',
          color: 'bg-green-500 text-white',
          icon: '🟢'
        };
      case 'at_risk':
        return {
          label: 'At Risk',
          color: 'bg-orange-500 text-white',
          icon: '🟠'
        };
      case 'behind':
        return {
          label: 'Behind',
          color: 'bg-red-500 text-white',
          icon: '🔴'
        };
      case 'paused':
        return {
          label: 'Paused',
          color: 'bg-yellow-500 text-white',
          icon: '🟡'
        };
      case 'canceled':
        return {
          label: 'Canceled',
          color: 'bg-gray-500 text-white',
          icon: '⚫'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-purple-500 text-white',
          icon: '🟣'
        };
      case 'partially_achieved':
        return {
          label: 'Partially Achieved',
          color: 'bg-green-400 text-white',
          icon: '✅'
        };
      case 'not_achieved':
        return {
          label: 'Not Achieved',
          color: 'bg-red-600 text-white',
          icon: '🔴'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-400 text-white',
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
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </span>
  );
}