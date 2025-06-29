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

  // Fetch related initiatives from the same key result
  const { data: relatedInitiatives } = useQuery({
    queryKey: ['/api/initiatives'],
    enabled: !!keyResult?.id,
    select: (data: any[]) => data.filter(init => 
      init.keyResultId === keyResult?.id && init.id !== id
    ),
  });

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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard?tab=initiatives">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Edit Initiative
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Initiative Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Initiative Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title and Description */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{initiativeData.title}</h1>
                {initiativeData.description && (
                  <p className="text-gray-600 mb-3">{initiativeData.description}</p>
                )}
                
                {/* Initiative Details */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Status:</span>
                    <Badge className={getStatusColor(initiativeData.status)}>
                      {getStatusLabel(initiativeData.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Priority:</span>
                    <Badge className={getPriorityColor(initiativeData.priority)}>
                      {getPriorityLabel(initiativeData.priority)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Budget:</span>
                    <span className="text-gray-900">{formatCurrency(initiativeData.budget)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Timeline:</span>
                    <span className="text-gray-900">{formatDate(initiativeData.startDate)} - {formatDate(initiativeData.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="grid grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{calculateProgress()}%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(initiativeData.budget)}</div>
                  <div className="text-sm text-gray-600">Budget</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{getStatusLabel(initiativeData.status)}</div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>

              {/* Key Result Information inside Overview */}
              {keyResult && (
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Key Result Terkait</span>
                  </div>
                  <Link href={`/key-result/${keyResult.id}`}>
                    <h4 className="font-semibold text-blue-900 hover:text-blue-700 cursor-pointer mb-1">
                      {keyResult.title}
                    </h4>
                  </Link>
                  <p className="text-sm text-blue-700">
                    {keyResult.description || "Tidak ada deskripsi"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-blue-600">
                      Progress: <span className="font-semibold">{(keyResult.progress || 0).toFixed(1)}%</span>
                    </span>
                    <span className="text-blue-600">
                      Target: <span className="font-semibold">
                        {keyResult.targetValue ? 
                          new Intl.NumberFormat('id-ID').format(parseFloat(keyResult.targetValue)) : 
                          '0'
                        } {keyResult.unit || ''}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Related Initiatives */}
              {relatedInitiatives && relatedInitiatives.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Initiative Terkait
                  </h3>
                  <div className="space-y-2">
                    {relatedInitiatives.map((relInit: any) => (
                      <Link key={relInit.id} href={`/initiative/${relInit.id}`}>
                        <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 hover:text-blue-600">
                                {relInit.title}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {relInit.pic?.firstName} {relInit.pic?.lastName}
                                </span>
                                <Badge className={getStatusColor(relInit.status)}>
                                  {getStatusLabel(relInit.status)}
                                </Badge>
                                <span>{relInit.progress || 0}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        {/* Right Column - Team and Recent Activity */}
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