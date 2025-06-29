import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Flag,
  Target,
  User,
  Users,
  Clock,
  FileText,
} from "lucide-react";
import { Link } from "wouter";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function InitiativeDetailPage() {
  const { id } = useParams();

  // Fetch initiative details with all related data (PIC, members, key result)
  const { data: initiative, isLoading: initiativeLoading } = useQuery({
    queryKey: [`/api/initiatives/${id}`],
    enabled: !!id,
  });

  // Extract data from the comprehensive initiative object with proper typing
  const initiativeData = initiative as any;
  const members = initiativeData?.members || [];
  const pic = initiativeData?.pic;
  const keyResult = initiativeData?.keyResult;

  if (initiativeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!initiativeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Initiative not found</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started": return "Belum Dimulai";
      case "in_progress": return "Sedang Berjalan";
      case "completed": return "Selesai";
      case "on_hold": return "Ditahan";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low": return "Rendah";
      case "medium": return "Sedang";
      case "high": return "Tinggi";
      case "critical": return "Kritis";
      default: return priority;
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "Tidak ada budget";
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Tidak ditentukan";
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Tanggal tidak valid";
    }
  };

  const calculateProgress = () => {
    // Since we removed task management, we'll use the progress from the database
    return initiativeData.progress || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard?tab=initiatives">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
            <div className="text-sm text-gray-500">
              Dashboard &gt; Initiatives &gt; {initiativeData.title}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title and Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {initiativeData.title}
                  </h2>
                  <Badge className={getStatusColor(initiativeData.status)}>
                    {getStatusLabel(initiativeData.status)}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm">
                  {initiativeData.description || "Tidak ada deskripsi"}
                </p>
              </div>

              <Separator />

              {/* Priority and Budget */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Flag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Prioritas:</span>
                  <Badge className={getPriorityColor(initiativeData.priority)}>
                    {getPriorityLabel(initiativeData.priority)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Budget:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(initiativeData.budget)}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Mulai:</span>
                  <span className="text-sm font-medium">
                    {formatDate(initiativeData.startDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Tenggat:</span>
                  <span className="text-sm font-medium">
                    {formatDate(initiativeData.dueDate)}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-gray-900">
                    {calculateProgress()}%
                  </span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Key Result Information Card */}
          {keyResult && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Result Terkait
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Link href={`/key-result/${keyResult.id}`}>
                    <h3 className="text-lg font-semibold text-blue-900 hover:text-blue-700 cursor-pointer">
                      {keyResult.title}
                    </h3>
                  </Link>
                  <p className="text-blue-700 text-sm mt-1">
                    {keyResult.description || "Tidak ada deskripsi"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Progress:</span>
                    <div className="mt-1">
                      <Progress 
                        value={keyResult.progress || 0} 
                        className="h-2 bg-blue-100" 
                      />
                      <span className="text-blue-800 font-semibold">
                        {(keyResult.progress || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Current:</span>
                    <div className="text-blue-800 font-semibold">
                      {keyResult.currentValue ? 
                        new Intl.NumberFormat('id-ID').format(parseFloat(keyResult.currentValue)) : 
                        '0'
                      } {keyResult.unit || ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Target:</span>
                    <div className="text-blue-800 font-semibold">
                      {keyResult.targetValue ? 
                        new Intl.NumberFormat('id-ID').format(parseFloat(keyResult.targetValue)) : 
                        '0'
                      } {keyResult.unit || ''}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* PIC */}
              {pic && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    PIC (Person in Charge)
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {pic.firstName?.charAt(0)}{pic.lastName?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {pic.firstName} {pic.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pic.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Members */}
              {members.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Anggota Tim ({members.length})
                  </div>
                  <div className="space-y-2">
                    {members.map((member: any) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {member.user?.firstName?.charAt(0)}{member.user?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.user?.firstName} {member.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!pic && members.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Belum ada anggota tim</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Belum ada aktivitas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}