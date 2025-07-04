import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Network, 
  Search, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Users, 
  Target,
  Lightbulb,
  CheckCircle2,
  Settings,
  ArrowRight,
  CircleDot
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NetworkNode {
  id: string;
  label: string;
  type: 'objective' | 'key_result' | 'initiative' | 'user' | 'team';
  group: string;
  level: number;
  progress?: number;
  status?: string;
  owner?: string;
  teamId?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  type: 'owns' | 'supports' | 'depends_on' | 'collaborates' | 'parent_child';
  strength: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export default function NetworkVisualization() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  
  // Fetch data for visualization
  const { data: objectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['/api/objectives'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
  });

  const { data: initiatives = [], isLoading: initiativesLoading } = useQuery({
    queryKey: ['/api/initiatives'],
  });

  const isLoading = objectivesLoading || usersLoading || teamsLoading || initiativesLoading;

  // Transform data for grid visualization
  const visualizationData = React.useMemo(() => {
    if (isLoading) return { teams: [], objectives: [], keyResults: [], initiatives: [], users: [] };

    const typedTeams = teams as any[];
    const typedUsers = users as any[];
    const typedObjectives = objectives as any[];
    const typedInitiatives = initiatives as any[];

    return {
      teams: typedTeams,
      users: typedUsers,
      objectives: typedObjectives,
      initiatives: typedInitiatives,
      keyResults: typedObjectives.flatMap((obj: any) => 
        obj.keyResults ? obj.keyResults.map((kr: any) => ({ ...kr, objectiveId: obj.id, objectiveTitle: obj.title })) : []
      )
    };
  }, [objectives, users, teams, initiatives, isLoading]);

  // Filter data based on search and filter criteria
  const filteredData = React.useMemo(() => {
    let { teams, users, objectives, keyResults, initiatives } = visualizationData;

    // Apply type filter
    if (selectedFilter !== "all") {
      teams = selectedFilter === "teams" ? teams : [];
      users = selectedFilter === "users" ? users : [];
      objectives = selectedFilter === "objectives" ? objectives : [];
      keyResults = selectedFilter === "key_results" ? keyResults : [];
      initiatives = selectedFilter === "initiatives" ? initiatives : [];
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      teams = teams.filter((t: any) => t.name?.toLowerCase().includes(term));
      users = users.filter((u: any) => 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term)
      );
      objectives = objectives.filter((o: any) => 
        o.title?.toLowerCase().includes(term)
      );
      keyResults = keyResults.filter((kr: any) => 
        kr.title?.toLowerCase().includes(term)
      );
      initiatives = initiatives.filter((i: any) => 
        i.title?.toLowerCase().includes(term)
      );
    }

    return { teams, users, objectives, keyResults, initiatives };
  }, [visualizationData, selectedFilter, searchTerm]);

  // Get node type color
  const getNodeColor = (type: string, status?: string) => {
    if (showProgress && status) {
      switch (status) {
        case 'completed': return 'bg-green-500';
        case 'on_track': return 'bg-blue-500';
        case 'at_risk': return 'bg-yellow-500';
        case 'behind': return 'bg-red-500';
        default: return 'bg-gray-400';
      }
    }
    
    switch (type) {
      case 'team': return 'bg-purple-500';
      case 'user': return 'bg-blue-500';
      case 'objective': return 'bg-green-500';
      case 'key_result': return 'bg-yellow-500';
      case 'initiative': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'on_track': return 'Sesuai Jalur';
      case 'at_risk': return 'Berisiko';
      case 'behind': return 'Tertinggal';
      default: return 'Belum Dimulai';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8 text-blue-600" />
            Jaringan Visualisasi Goal Kolaboratif
          </h1>
          <p className="text-gray-600 mt-1">
            Eksplorasi hubungan dan ketergantungan antar goal, ukuran keberhasilan, dan tim
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Kontrol Visualisasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <Label htmlFor="search">Cari Node</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Cari goal, tim, atau pengguna..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter */}
              <div>
                <Label htmlFor="filter">Filter Tipe</Label>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="teams">Tim</SelectItem>
                    <SelectItem value="users">Pengguna</SelectItem>
                    <SelectItem value="objectives">Goal</SelectItem>
                    <SelectItem value="key_results">Angka Target</SelectItem>
                    <SelectItem value="initiatives">Rencana</SelectItem>
                  </SelectContent>
                </Select>
              </div>



              {/* Toggle Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-labels"
                    checked={showLabels}
                    onCheckedChange={setShowLabels}
                  />
                  <Label htmlFor="show-labels">Tampilkan Label</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-progress"
                    checked={showProgress}
                    onCheckedChange={setShowProgress}
                  />
                  <Label htmlFor="show-progress">Tampilkan Progress</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Tim</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Pengguna</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Angka Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">Rencana</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium">Jenis Koneksi:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-red-500"></div>
                    <span className="text-xs">Memiliki</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-500"></div>
                    <span className="text-xs">Mendukung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500"></div>
                    <span className="text-xs">Hierarki</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-purple-500"></div>
                    <span className="text-xs">Kolaborasi</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Node Info */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detail Node</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{selectedNode.label}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedNode.type === 'objective' ? 'Goal' :
                     selectedNode.type === 'key_result' ? 'Angka Target' :
                     selectedNode.type === 'initiative' ? 'Rencana' :
                     selectedNode.type === 'user' ? 'Pengguna' : 'Tim'}
                  </Badge>
                </div>
                
                {selectedNode.progress !== undefined && (
                  <div>
                    <Label className="text-sm">Progress</Label>
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedNode.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{selectedNode.progress}%</p>
                    </div>
                  </div>
                )}

                {selectedNode.status && (
                  <div>
                    <Label className="text-sm">Status</Label>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 ${
                        selectedNode.status === 'completed' ? 'border-green-500 text-green-700' :
                        selectedNode.status === 'on_track' ? 'border-blue-500 text-blue-700' :
                        selectedNode.status === 'at_risk' ? 'border-yellow-500 text-yellow-700' :
                        selectedNode.status === 'behind' ? 'border-red-500 text-red-700' :
                        'border-gray-500 text-gray-700'
                      }`}
                    >
                      {selectedNode.status === 'completed' ? 'Selesai' :
                       selectedNode.status === 'on_track' ? 'Sesuai Jalur' :
                       selectedNode.status === 'at_risk' ? 'Berisiko' :
                       selectedNode.status === 'behind' ? 'Tertinggal' :
                       'Belum Dimulai'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visualization Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Jaringan Kolaborasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Teams Section */}
                {filteredData.teams.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      Tim ({filteredData.teams.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredData.teams.map((team: any) => (
                        <div
                          key={team.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedNode({ ...team, type: 'team' })}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${getNodeColor('team')}`}></div>
                            <div>
                              <p className="font-medium">{team.name}</p>
                              <p className="text-sm text-gray-500">{team.description || 'Tidak ada deskripsi'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Objectives Section */}
                {filteredData.objectives.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Goal ({filteredData.objectives.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredData.objectives.map((objective: any) => (
                        <div
                          key={objective.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedNode({ ...objective, type: 'objective' })}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-full mt-1 ${getNodeColor('objective', objective.status)}`}></div>
                            <div className="flex-1">
                              <p className="font-medium">{objective.title}</p>
                              <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
                              {showProgress && objective.overallProgress !== undefined && (
                                <div className="mt-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500">Progress</span>
                                    <span className="text-xs font-medium">{objective.overallProgress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${objective.overallProgress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              {objective.status && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {getStatusLabel(objective.status)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Results Section */}
                {filteredData.keyResults.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CircleDot className="h-5 w-5 text-yellow-500" />
                      Angka Target ({filteredData.keyResults.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredData.keyResults.map((keyResult: any) => (
                        <div
                          key={keyResult.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedNode({ ...keyResult, type: 'key_result' })}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-full mt-1 ${getNodeColor('key_result', keyResult.status)}`}></div>
                            <div className="flex-1">
                              <p className="font-medium">{keyResult.title}</p>
                              <p className="text-sm text-gray-400 mt-1">Goal: {keyResult.objectiveTitle}</p>
                              {showProgress && keyResult.progress !== undefined && (
                                <div className="mt-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500">Progress</span>
                                    <span className="text-xs font-medium">{keyResult.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${keyResult.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initiatives Section */}
                {filteredData.initiatives.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-red-500" />
                      Rencana ({filteredData.initiatives.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredData.initiatives.map((initiative: any) => (
                        <div
                          key={initiative.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedNode({ ...initiative, type: 'initiative' })}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-full mt-1 ${getNodeColor('initiative', initiative.status)}`}></div>
                            <div className="flex-1">
                              <p className="font-medium">{initiative.title}</p>
                              <p className="text-sm text-gray-500 mt-1">{initiative.description}</p>
                              {showProgress && initiative.progress !== undefined && (
                                <div className="mt-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500">Progress</span>
                                    <span className="text-xs font-medium">{initiative.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${initiative.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Section */}
                {filteredData.users.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      Pengguna ({filteredData.users.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredData.users.map((user: any) => (
                        <div
                          key={user.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedNode({ ...user, type: 'user' })}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${getNodeColor('user')}`}></div>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {user.role === 'admin' ? 'Admin' : 
                                 user.role === 'manager' ? 'Manager' : 'Member'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {filteredData.teams.length === 0 && 
                 filteredData.objectives.length === 0 && 
                 filteredData.keyResults.length === 0 && 
                 filteredData.initiatives.length === 0 && 
                 filteredData.users.length === 0 && (
                  <div className="text-center py-12">
                    <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 
                        `Tidak ada hasil untuk pencarian "${searchTerm}"` : 
                        'Tidak ada data yang tersedia untuk filter yang dipilih'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}