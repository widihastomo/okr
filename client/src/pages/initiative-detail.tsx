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
              <CardTitle className="text-lg">
                Initiative Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title and Description */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">{initiativeData.title}</h1>
                {initiativeData.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{initiativeData.description}</p>
                )}
              </div>
              
              {/* Initiative Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge className={`${getStatusColor(initiativeData.status)} border-0 py-0`}>
                    {getStatusLabel(initiativeData.status)}
                  </Badge>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <Badge className={`${getPriorityColor(initiativeData.priority)} border-0 py-0`}>
                    {getPriorityLabel(initiativeData.priority)}
                  </Badge>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Budget</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(initiativeData.budget)}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Timeline</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(initiativeData.startDate)} - {formatDate(initiativeData.dueDate)}
                  </p>
                </div>
              </div>

              {/* Progress Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Progress Overview</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-xl font-bold text-blue-600">{calculateProgress()}%</span>
                    </div>
                    <Progress value={calculateProgress()} className="h-2 bg-blue-100" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/70 backdrop-blur rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-600 block mb-1">Budget Allocated</span>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(initiativeData.budget)}</p>
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-600 block mb-1">Days Remaining</span>
                      <p className="text-sm font-bold text-gray-900">
                        {initiativeData.dueDate ? 
                          Math.max(0, Math.ceil((new Date(initiativeData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
                          : '-'
                        } days
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Result Information inside Overview */}
              {keyResult && (
                <div className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-900">Key Result Terkait</span>
                    <Link href={`/key-result/${keyResult.id}`} className="text-blue-600 hover:text-blue-800 text-xs">
                      →
                    </Link>
                  </div>
                  
                  <Link href={`/key-result/${keyResult.id}`}>
                    <h4 className="text-sm font-semibold text-blue-900 hover:text-blue-700 transition-colors mb-1">
                      {keyResult.title}
                    </h4>
                  </Link>
                  
                  {keyResult.description && (
                    <p className="text-xs text-blue-700 mb-2 line-clamp-2">
                      {keyResult.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/50 backdrop-blur rounded p-2">
                      <p className="text-xs text-blue-600">Progress</p>
                      <div className="flex items-center gap-1">
                        <Progress value={keyResult.progress || 0} className="h-1.5 bg-blue-100 flex-1" />
                        <span className="text-xs font-bold text-blue-900">{(keyResult.progress || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="bg-white/50 backdrop-blur rounded p-2">
                      <p className="text-xs text-blue-600">Target</p>
                      <p className="text-xs font-bold text-blue-900">
                        {keyResult.targetValue ? 
                          new Intl.NumberFormat('id-ID').format(parseFloat(keyResult.targetValue)) : 
                          '0'
                        } {keyResult.unit || ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Initiatives */}
              {relatedInitiatives && relatedInitiatives.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Initiative Terkait</h3>
                  <div className="grid gap-2">
                    {relatedInitiatives.map((relInit: any) => (
                      <Link key={relInit.id} href={`/initiative/${relInit.id}`}>
                        <div className="group border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                {relInit.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-gray-600">
                                  {relInit.pic?.firstName} {relInit.pic?.lastName}
                                </span>
                                <Badge className={`${getStatusColor(relInit.status)} text-xs py-0`}>
                                  {getStatusLabel(relInit.status)}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">{relInit.progress || 0}%</div>
                              <div className="text-xs text-gray-500">Progress</div>
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
            <CardTitle>
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
                <p className="text-sm">Belum ada anggota tim</p>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Recent Activity Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Belum ada aktivitas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}