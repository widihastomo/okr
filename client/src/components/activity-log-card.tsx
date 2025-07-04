import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  TrendingUp, 
  BarChart3, 
  Target,
  FileText,
  CheckSquare
} from "lucide-react";

interface ActivityLogEntry {
  id: string;
  type: 'key_result_checkin' | 'initiative' | 'task';
  entityId: string;
  entityTitle: string;
  action: string;
  value?: string;
  unit?: string;
  notes?: string;
  confidence?: number;
  createdAt: Date | null;
  createdBy?: string;
}

interface ActivityLogCardProps {
  objectiveId: string;
}

export default function ActivityLogCard({ objectiveId }: ActivityLogCardProps) {
  const { data: activities = [], isLoading } = useQuery<ActivityLogEntry[]>({
    queryKey: ['/api/objectives', objectiveId, 'activity-log'],
    queryFn: async () => {
      const response = await fetch(`/api/objectives/${objectiveId}/activity-log`);
      if (!response.ok) throw new Error('Failed to fetch activity log');
      return response.json();
    }
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const formatValue = (value: string, unit: string) => {
    const num = parseFloat(value);
    if (unit === "Rp") {
      return `Rp ${num.toLocaleString("id-ID")}`;
    } else if (unit === "%") {
      return `${num.toLocaleString("id-ID")}%`;
    } else {
      return `${num.toLocaleString("id-ID")} ${unit}`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'key_result_checkin': return <TrendingUp className="w-4 h-4" />;
      case 'initiative': return <FileText className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'key_result_checkin': return 'bg-blue-500';
      case 'initiative': return 'bg-green-500';
      case 'task': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'key_result_checkin': return 'Ukuran Keberhasilan';
      case 'initiative': return 'Rencana';
      case 'task': return 'Tugas';
      default: return 'Update';
    }
  };

  const getUserName = (userId: string) => {
    const user = (users as any[]).find((u: any) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Riwayat Aktivitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
            <p className="mt-2">Memuat aktivitas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Riwayat Aktivitas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.slice(0, 10).map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 ${getTypeColor(activity.type)} rounded-full mt-2`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activity.value && (
                        <p className={`font-semibold ${
                          activity.type === 'key_result_checkin' ? 'text-blue-600' :
                          activity.type === 'initiative' ? 'text-green-600' :
                          'text-purple-600'
                        }`}>
                          {formatValue(activity.value, activity.unit || "")}
                        </p>
                      )}
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                        {getTypeLabel(activity.type)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {activity.createdAt ? format(new Date(activity.createdAt), "MMM dd") : "Unknown"}
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 mb-1 font-medium">
                    {activity.entityTitle}
                  </div>
                  {activity.notes && (
                    <div className="mt-1">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {activity.notes}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {activity.confidence && activity.type === 'key_result_checkin' && (
                      <div className="flex items-center gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  activity.confidence >= 8 ? 'bg-green-500' :
                                  activity.confidence >= 6 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${(activity.confidence / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 font-medium">
                              {activity.confidence}/10
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">
                              {activity.confidence >= 8 ? 'Tinggi' :
                               activity.confidence >= 6 ? 'Sedang' : 'Rendah'}
                            </span> - {' '}
                            {activity.confidence >= 8 ? 'Sangat yakin target tercapai' :
                             activity.confidence >= 6 ? 'Cukup optimis dengan progress' :
                             'Butuh perhatian lebih untuk mencapai target'}
                          </div>
                        </div>
                      </div>
                    )}
                    {activity.createdBy && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className={`w-6 h-6 ${getTypeColor(activity.type)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                          {getUserName(activity.createdBy).charAt(0).toUpperCase()}
                        </div>
                        <span>{getUserName(activity.createdBy)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada aktivitas</p>
            <p className="text-sm">Aktivitas akan muncul ketika ada update pada ukuran keberhasilan, rencana, atau tugas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}