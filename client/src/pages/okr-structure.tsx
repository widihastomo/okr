import { useState } from "react";
import Sidebar from "@/components/sidebar";
import OKRHierarchyView from "@/components/okr-hierarchy-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Filter, 
  Download,
  RefreshCw
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function OKRStructurePage() {
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: cycles } = useQuery({
    queryKey: ["/api/cycles"],
    retry: false,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/okrs-with-hierarchy"] });
    queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
    queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Struktur OKR</h1>
              <p className="text-sm text-gray-600 mt-1">
                Lihat hierarki lengkap: Objective → Key Results → Initiatives → Tasks
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Tabs defaultValue="hierarchy" className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="hierarchy">Hierarki Lengkap</TabsTrigger>
                  <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                
                {cycles && cycles.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Cycle:</span>
                    <select 
                      className="px-3 py-1 border rounded-md text-sm"
                      value={selectedCycle || ""}
                      onChange={(e) => setSelectedCycle(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Semua Cycles</option>
                      {cycles.map((cycle: any) => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <TabsContent value="hierarchy" className="space-y-6">
                <OKRHierarchyView />
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Objectives
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-gray-500 mt-1">
                        Across all cycles
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Key Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-gray-500 mt-1">
                        Active measurements
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Initiatives
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-gray-500 mt-1">
                        Strategic projects
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-gray-500 mt-1">
                        Actionable items
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Struktur Hierarki OKR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium text-green-900">Objective</h4>
                          <p className="text-sm text-green-700">
                            Tujuan strategis utama yang ingin dicapai dalam periode tertentu
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400 ml-8">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900">Key Results</h4>
                          <p className="text-sm text-blue-700">
                            Metrik spesifik dan terukur yang menunjukkan pencapaian objective
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400 ml-16">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium text-orange-900">Initiatives</h4>
                          <p className="text-sm text-orange-700">
                            Proyek atau program strategis untuk mencapai key results
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400 ml-24">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          4
                        </div>
                        <div>
                          <h4 className="font-medium text-purple-900">Tasks</h4>
                          <p className="text-sm text-purple-700">
                            Tugas operasional harian untuk menjalankan initiatives
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart akan ditampilkan di sini
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Completion Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-gray-500">
                        Timeline chart akan ditampilkan di sini
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}