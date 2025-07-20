import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { History, User, Clock, Edit3, Plus, Trash2, CheckCircle } from 'lucide-react';

interface InitiativeHistoryEntry {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  metadata?: {
    oldValue?: string;
    newValue?: string;
    fieldName?: string;
  };
}

interface InitiativeHistoryProps {
  initiativeId: string;
}

export function InitiativeHistory({ initiativeId }: InitiativeHistoryProps) {
  // Fetch initiative history from audit trail
  const { data: historyData = [], isLoading } = useQuery<InitiativeHistoryEntry[]>({
    queryKey: [`/api/initiatives/${initiativeId}/history`],
    enabled: !!initiativeId
  });

  // Ensure historyData is always an array
  const history = Array.isArray(historyData) ? historyData : [];

  const getUserInitials = (user: InitiativeHistoryEntry['user']) => {
    const name = user.name || "";
    if (name && name.trim() !== '') {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: InitiativeHistoryEntry['user']) => {
    if (user.name && user.name.trim() !== '') {
      return user.name.trim();
    }
    return user.email?.split('@')[0] || 'Unknown User';
  };

  // Translate old terminology to new terminology for display
  const translateDescription = (description: string) => {
    return description
      .replace(/Definition of done/gi, 'Output')
      .replace(/definition of done/gi, 'output')
      .replace(/Created Definition of done/gi, 'Created output')
      .replace(/Added Definition of done/gi, 'Added output')
      .replace(/Edited Definition of done/gi, 'Edited output')
      .replace(/Deleted Definition of done/gi, 'Deleted output')
      .replace(/Toggled Definition of done/gi, 'Toggled output')
      .replace(/Updated Definition of done/gi, 'Updated output');
  };

  const formatTimestamp = (timestamp: Date) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'baru saja';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} jam yang lalu`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'updated':
        return <Edit3 className="w-4 h-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'status_changed':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'updated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'status_changed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Riwayat Inisiatif</CardTitle>
          <CardDescription className="text-sm">Timeline aktivitas dan perubahan</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex gap-2 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Riwayat Inisiatif</CardTitle>
        <CardDescription className="text-sm">Timeline aktivitas dan perubahan</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {history.length > 0 ? (
            history.map((entry, index) => (
              <div key={entry.id} className="flex gap-2">
                <div className="flex flex-col items-center">
                  <div className="p-1.5 rounded-full bg-gray-100">
                    {getActionIcon(entry.action)}
                  </div>
                  {index < history.length - 1 && (
                    <div className="w-px h-6 bg-gray-200 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-xs font-medium text-gray-900">
                    {translateDescription(entry.description)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500">{getUserDisplayName(entry.user)}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Belum ada riwayat aktivitas untuk inisiatif ini</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}