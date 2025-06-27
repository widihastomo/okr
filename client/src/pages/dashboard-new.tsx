import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  User, 
  Edit, 
  MoreHorizontal,
  ChevronDown 
} from "lucide-react";
import { Link } from "wouter";
import type { OKRWithKeyResults } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardStats {
  totalOKRs: number;
  onTrack: number;
  atRisk: number;
  completed: number;
  avgProgress: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: okrs = [], isLoading: okrsLoading } = useQuery<OKRWithKeyResults[]>({
    queryKey: ["/api/okrs"],
  });

  if (statsLoading || okrsLoading) {
    return (
      <div className="lg:ml-64 min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-center text-gray-500 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:ml-64 min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OKR Dashboard</h1>
            <p className="text-gray-600">Q4 2024 • Track your objectives and key results</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select defaultValue="all-status">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="behind">Behind</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="all-periods">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-periods">All Periods</SelectItem>
                <SelectItem value="q1-2024">Q1 2024</SelectItem>
                <SelectItem value="q2-2024">Q2 2024</SelectItem>
                <SelectItem value="q3-2024">Q3 2024</SelectItem>
                <SelectItem value="q4-2024">Q4 2024</SelectItem>
              </SelectContent>
            </Select>
            
            <Link href="/okr-structure">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New OKR
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total OKRs</p>
                  <p className="text-3xl font-bold text-gray-900">1</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Track</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">At Risk</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-3xl font-bold text-gray-900">60%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OKRs List */}
        <div className="space-y-4">
          {okrs.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No OKRs found</h3>
                <p className="text-gray-600 mb-4">Start by creating your first OKR to track your objectives and key results.</p>
                <Link href="/okr-structure">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First OKR
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {okrs.map((okr) => (
                <Card key={okr.id} className="bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link href={`/objective/${okr.id}`}>
                            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                              {okr.title}
                            </h3>
                          </Link>
                          <Badge className="bg-blue-600 text-white px-2 py-1 text-xs rounded">
                            In Progress
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{okr.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Q1 2025</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>Admin User</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>45 days remaining</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">59.595959595959%</p>
                          <p className="text-sm text-gray-500">Overall Progress</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Key Results */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Key Results</h4>
                      {okr.keyResults.slice(0, 3).map((kr) => {
                        const progress = 60; // Static untuk demo sesuai gambar
                        
                        return (
                          <div key={kr.id} className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-gray-900 font-medium">{kr.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    ↗ Increase to
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  {kr.description}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  60.00 / 100.00
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs bg-gray-100">
                                    Dalam Progress
                                  </Badge>
                                  <Progress value={60} className="flex-1 h-2" />
                                  <span className="text-sm font-medium">60%</span>
                                </div>
                              </div>
                              <div className="ml-4 flex space-x-2">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                  Check-in
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}