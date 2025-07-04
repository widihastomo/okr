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
  const [tourStep, setTourStep] = useState<number>(0);
  const [showTour, setShowTour] = useState(false);
  
  // Fetch data for visualization
  const { data: objectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['/api/okrs'],
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

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const isLoading = objectivesLoading || usersLoading || teamsLoading || initiativesLoading || tasksLoading;

  // Transform data for grid visualization
  const visualizationData = React.useMemo(() => {
    if (isLoading) return { teams: [], objectives: [], keyResults: [], initiatives: [], users: [], tasks: [] };

    const typedTeams = teams as any[];
    const typedUsers = users as any[];
    const typedObjectives = objectives as any[];
    const typedInitiatives = initiatives as any[];
    const typedTasks = tasks as any[];

    return {
      teams: typedTeams,
      users: typedUsers,
      objectives: typedObjectives,
      initiatives: typedInitiatives,
      tasks: typedTasks,
      keyResults: typedObjectives.flatMap((obj: any) => 
        obj.keyResults ? obj.keyResults.map((kr: any) => ({ ...kr, objectiveId: obj.id, objectiveTitle: obj.title })) : []
      )
    };
  }, [objectives, users, teams, initiatives, tasks, isLoading]);

  // Filter data based on search and filter criteria
  const filteredData = React.useMemo(() => {
    let { teams, users, objectives, keyResults, initiatives, tasks } = visualizationData;

    // Apply type filter
    if (selectedFilter !== "all") {
      teams = selectedFilter === "teams" ? teams : [];
      users = selectedFilter === "users" ? users : [];
      objectives = selectedFilter === "objectives" ? objectives : [];
      keyResults = selectedFilter === "key_results" ? keyResults : [];
      initiatives = selectedFilter === "initiatives" ? initiatives : [];
      tasks = selectedFilter === "tasks" ? tasks : [];
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
      tasks = tasks.filter((t: any) => 
        t.title?.toLowerCase().includes(term)
      );
    }

    return { teams, users, objectives, keyResults, initiatives, tasks };
  }, [visualizationData, selectedFilter, searchTerm]);

  // Tour functionality
  const tourSteps = [
    {
      target: '.tour-objectives',
      title: 'Goals (Objectives)',
      description: 'Setiap goal menampilkan judul, deskripsi, owner, dan progress keseluruhan. Goal adalah tingkat tertinggi dalam hierarki OKR.'
    },
    {
      target: '.tour-keyresults',
      title: 'Key Results (Angka Target)',
      description: 'Di bawah setiap goal terdapat key results yang menunjukkan metrik terukur dengan progress bar untuk tracking pencapaian.'
    },
    {
      target: '.tour-initiatives',
      title: 'Initiatives (Rencana)',
      description: 'Initiatives adalah rencana konkret untuk mencapai key results, menampilkan progress dan status pelaksanaan.'
    },
    {
      target: '.tour-connecting-lines',
      title: 'Connecting Lines',
      description: 'Garis penghubung menunjukkan hubungan hierarkis antara Goals → Key Results → Initiatives → Tasks.'
    },
    {
      target: '.tour-filters',
      title: 'Filter & Search',
      description: 'Gunakan filter status dan pencarian untuk fokus pada goal tertentu. Toggle progress dan label sesuai kebutuhan.'
    }
  ];

  const startTour = () => {
    setShowTour(true);
    setTourStep(0);
  };

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setShowTour(false);
      setTourStep(0);
    }
  };

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

// Tree Node Components
interface ObjectiveTreeNodeProps {
  objective: any;
  initiatives: any[];
  tasks: any[];
  showProgress: boolean;
  onNodeClick: (node: any) => void;
}

function ObjectiveTreeNode({ objective, initiatives, tasks, showProgress, onNodeClick }: ObjectiveTreeNodeProps) {
  const objectiveInitiatives = initiatives.filter((init: any) => 
    objective.keyResults?.some((kr: any) => kr.id === init.keyResultId)
  );



  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Objective/Goal Header */}
      <div 
        className="flex items-center gap-4 mb-6 cursor-pointer hover:bg-gray-50 p-4 rounded-lg -m-4 mb-2"
        onClick={() => onNodeClick({ ...objective, type: 'objective' })}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
          <Target className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">{objective.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
          {showProgress && objective.overallProgress !== undefined && (
            <div className="mt-3 max-w-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs font-medium">{objective.overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${objective.overallProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Results */}
      {objective.keyResults && objective.keyResults.length > 0 && (
        <div className="mt-6">
          {/* Connecting line */}
          <div className="flex justify-center mb-4">
            <div className="w-0.5 h-6 bg-gray-300"></div>
          </div>
          
          {/* Key Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objective.keyResults.map((keyResult: any, index: number) => (
              <div key={keyResult.id} className="relative">
                {/* Connecting line from above */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-300 -mt-6"></div>
                
                <KeyResultTreeNode 
                  keyResult={keyResult}
                  initiatives={objectiveInitiatives.filter((init: any) => init.keyResultId === keyResult.id)}
                  showProgress={showProgress}
                  onNodeClick={onNodeClick}
                  isFirst={index === 0}
                  isLast={index === objective.keyResults.length - 1}
                  totalCount={objective.keyResults.length}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface KeyResultTreeNodeProps {
  keyResult: any;
  initiatives: any[];
  showProgress: boolean;
  onNodeClick: (node: any) => void;
  isFirst: boolean;
  isLast: boolean;
  totalCount: number;
}

function KeyResultTreeNode({ keyResult, initiatives, showProgress, onNodeClick, isFirst, isLast, totalCount }: KeyResultTreeNodeProps) {

  return (
    <div className="relative">
      {/* Vertical line from horizontal connector */}
      <div className="absolute left-6 -top-8 w-0.5 h-8 bg-gray-300"></div>
      
      {/* Key Result Card */}
      <div 
        className="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onNodeClick({ ...keyResult, type: 'key_result' })}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
            <CircleDot className="h-4 w-4 text-yellow-600" />
          </div>
          <h4 className="font-medium text-gray-900">{keyResult.title}</h4>
        </div>
        
        {showProgress && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-sm font-medium text-gray-900">{keyResult.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${keyResult.progress || 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Initiatives */}
      {initiatives.length > 0 && (
        <div className="relative mt-4">
          {/* Vertical line from key result */}
          <div className="absolute left-6 top-0 w-0.5 h-4 bg-gray-300"></div>
          
          <div className="pt-4 space-y-3">
            {initiatives.map((initiative: any, index: number) => (
              <InitiativeTreeNode 
                key={initiative.id}
                initiative={initiative}
                showProgress={showProgress}
                onNodeClick={onNodeClick}
                isLast={index === initiatives.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface InitiativeTreeNodeProps {
  initiative: any;
  showProgress: boolean;
  onNodeClick: (node: any) => void;
  isLast: boolean;
}

function InitiativeTreeNode({ initiative, showProgress, onNodeClick, isLast }: InitiativeTreeNodeProps) {
  // For now, we'll show initiatives without tasks until we implement task fetching
  const tasks = initiative.tasks || [];

  return (
    <div className="relative">
      {/* Vertical line from key result */}
      <div className="absolute left-6 -top-4 w-0.5 h-4 bg-gray-300"></div>
      
      {/* Initiative Card */}
      <div 
        className="bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition-colors ml-6"
        onClick={() => onNodeClick({ ...initiative, type: 'initiative' })}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-6 h-6 bg-orange-200 rounded">
            <Lightbulb className="h-3 w-3 text-orange-600" />
          </div>
          <h5 className="font-medium text-gray-900 text-sm">{initiative.title}</h5>
        </div>
        
        {showProgress && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-medium text-gray-900">{initiative.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${initiative.progress || 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Tasks - To be implemented later */}
    </div>
  );
}

interface TaskTreeNodeProps {
  task: any;
  showProgress: boolean;
  onNodeClick: (node: any) => void;
  isLast: boolean;
}

function TaskTreeNode({ task, showProgress, onNodeClick, isLast }: TaskTreeNodeProps) {
  return (
    <div className="relative">
      {/* Vertical line from initiative */}
      <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-300"></div>
      
      {/* Horizontal line */}
      <div className="absolute left-6 top-0 w-4 h-0.5 bg-gray-300"></div>
      
      {/* Task Card */}
      <div 
        className="bg-blue-50 border border-blue-200 rounded p-2 cursor-pointer hover:bg-blue-100 transition-colors ml-10"
        onClick={() => onNodeClick({ ...task, type: 'task' })}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-4 h-4 bg-blue-200 rounded">
            {task.status === 'completed' ? (
              <CheckCircle2 className="h-2.5 w-2.5 text-green-600" />
            ) : (
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            )}
          </div>
          <h6 className="font-medium text-gray-900 text-xs">{task.title}</h6>
        </div>
        
        {showProgress && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-medium text-gray-900">{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
              <div className="space-y-6">
                {/* Tree View Visualization */}
                {filteredData.objectives.length > 0 ? (
                  <div className="space-y-8">
                    {filteredData.objectives.map((objective: any) => (
                      <ObjectiveTreeNode 
                        key={objective.id}
                        objective={objective}
                        initiatives={filteredData.initiatives}
                        tasks={filteredData.tasks}
                        showProgress={showProgress}
                        onNodeClick={setSelectedNode}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 
                        `Tidak ada hasil untuk pencarian "${searchTerm}"` : 
                        'Tidak ada goal yang tersedia untuk filter yang dipilih'
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