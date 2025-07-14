import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    firstName: string | null;
    lastName: string | null;
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
    if (user.firstName || user.lastName) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: InitiativeHistoryEntry['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || 'Unknown User';
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Inisiatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Inisiatif
            <Badge variant="secondary" className="ml-2">
              {history.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Belum ada riwayat aktivitas untuk inisiatif ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200 -ml-px" />
                )}
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 relative">
                    <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                      <AvatarFallback className="text-xs font-medium">
                        {getUserInitials(entry.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                      {getActionIcon(entry.action)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActionColor(entry.action)}>
                        {entry.action}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-1">
                      <span className="font-medium">{getUserDisplayName(entry.user)}</span>
                      {' '}
                      <span>{entry.description}</span>
                    </div>
                    
                    {entry.metadata && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {entry.metadata.fieldName && (
                          <div>
                            <strong>{entry.metadata.fieldName}:</strong>
                            {entry.metadata.oldValue && (
                              <span className="ml-1">
                                "{entry.metadata.oldValue}" → "{entry.metadata.newValue}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}