import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Users, Calendar, LogOut, User as UserIcon } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const quickActions = [
    {
      title: "Lihat OKR",
      description: "Kelola dan pantau semua Objectives & Key Results",
      icon: Target,
      href: "/",
      color: "bg-blue-500"
    },
    {
      title: "Company OKRs",
      description: "OKR tingkat perusahaan dan strategis",
      icon: TrendingUp,
      href: "/company-okrs",
      color: "bg-green-500"
    },
    {
      title: "Kelola Tim",
      description: "Atur anggota tim dan permissions",
      icon: Users,
      href: "/users",
      color: "bg-purple-500"
    },
    {
      title: "Siklus & Template",
      description: "Atur periode dan template OKR",
      icon: Calendar,
      href: "/cycles",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OKR Manager</h1>
                <p className="text-sm text-gray-500">Selamat datang kembali!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Welcome User</p>
                  <p className="text-gray-500">Member</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/api/logout'}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard OKR
          </h2>
          <p className="text-gray-600">
            Kelola tujuan dan hasil kunci untuk mencapai kesuksesan tim dan organisasi
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>
                  Update terbaru dari OKR dan progress tim
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Progress Update:</span> Key Result "Increase Product Adoption" telah diperbarui
                      </p>
                      <p className="text-xs text-gray-500">2 jam yang lalu</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">New OKR:</span> Objective baru "Improve Customer Satisfaction" telah dibuat
                      </p>
                      <p className="text-xs text-gray-500">5 jam yang lalu</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Team Update:</span> Anggota baru bergabung dengan tim Engineering
                      </p>
                      <p className="text-xs text-gray-500">1 hari yang lalu</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status OKR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">On Track</span>
                    <span className="text-sm font-medium text-green-600">5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">At Risk</span>
                    <span className="text-sm font-medium text-yellow-600">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Behind</span>
                    <span className="text-sm font-medium text-red-600">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-blue-600">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tim Aktif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">E</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Engineering</p>
                      <p className="text-xs text-gray-500">8 anggota</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">P</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Product</p>
                      <p className="text-xs text-gray-500">5 anggota</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}