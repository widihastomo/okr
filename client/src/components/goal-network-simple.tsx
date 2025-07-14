import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target,
  Users,
  Zap,
  ArrowRight,
  Filter,
  RefreshCw
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NetworkItem {
  id: string;
  type: 'objective' | 'key_result' | 'initiative' | 'user';
  title: string;
  status: string;
  progress?: number;
  connections: string[];
  owner?: string;
  ownerName?: string;
}

export default function GoalNetworkSimple() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<NetworkItem | null>(null);

  // Fetch data
  const { data: objectives = [] } = useQuery({
    queryKey: ["/api/objectives"],
  });

  const { data: keyResults = [] } = useQuery({
    queryKey: ["/api/key-results"],
  });

  const { data: initiatives = [] } = useQuery({
    queryKey: ["/api/initiatives"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const calculateKeyResultProgress = (keyResult: any): number => {
    const current = Number(keyResult.currentValue) || 0;
    const target = Number(keyResult.targetValue) || 0;
    const base = Number(keyResult.baseValue) || 0;

    if (keyResult.keyResultType === "achieve_or_not") {
      return keyResult.achieved ? 100 : 0;
    }

    if (keyResult.keyResultType === "increase_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((current - base) / (target - base)) * 100));
    }

    if (keyResult.keyResultType === "decrease_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((base - current) / (base - target)) * 100));
    }

    if (keyResult.keyResultType === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (keyResult.keyResultType === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

  // Transform data into network items
  const buildNetworkItems = (): NetworkItem[] => {
    const items: NetworkItem[] = [];
    const userMap = new Map((users as any[]).map(u => [u.id, `${u.firstName} ${u.lastName}`]));

    // Add objectives
    (objectives as any[]).forEach((obj: any) => {
      const connections: string[] = [];
      
      // Find connected key results
      (keyResults as any[]).forEach((kr: any) => {
        if (kr.objectiveId === obj.id) {
          connections.push(kr.id);
        }
      });

      items.push({
        id: obj.id,
        type: 'objective',
        title: obj.title,
        status: obj.status,
        progress: obj.progress || 0,
        connections,
        owner: obj.ownerId,
        ownerName: userMap.get(obj.ownerId) || 'Unknown'
      });
    });

    // Add key results
    (keyResults as any[]).forEach((kr: any) => {
      const connections: string[] = [];
      
      // Connected to objective
      if (kr.objectiveId) {
        connections.push(kr.objectiveId);
      }

      // Find connected initiatives
      (initiatives as any[]).forEach((init: any) => {
        if (init.keyResultId === kr.id) {
          connections.push(init.id);
        }
      });

      items.push({
        id: kr.id,
        type: 'key_result',
        title: kr.title,
        status: kr.status,
        progress: calculateKeyResultProgress(kr),
        connections,
        owner: kr.assignedTo,
        ownerName: userMap.get(kr.assignedTo) || 'Belum ditentukan'
      });
    });

    // Add initiatives
    (initiatives as any[]).forEach((init: any) => {
      const connections: string[] = [];
      
      // Connected to key result
      if (init.keyResultId) {
        connections.push(init.keyResultId);
      }

      items.push({
        id: init.id,
        type: 'initiative',
        title: init.title,
        status: init.status,
        progress: init.progress || 0,
        connections,
        owner: init.picId,
        ownerName: userMap.get(init.picId) || 'Belum ditentukan'
      });
    });

    return items;
  };

  const networkItems = buildNetworkItems();

  // Filter items based on selected filter
  const filteredItems = networkItems.filter(item => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "objectives") return item.type === 'objective';
    if (selectedFilter === "key_results") return item.type === 'key_result';
    if (selectedFilter === "initiatives") return item.type === 'initiative';
    return true;
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'objective': return <Target className="h-5 w-5" />;
      case 'key_result': return <Zap className="h-4 w-4" />;
      case 'initiative': return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === 'objective') {
      switch (status) {
        case 'on_track': return 'border-green-300 text-green-700 bg-green-50';
        case 'at_risk': return 'border-yellow-300 text-yellow-700 bg-yellow-50';
        case 'behind': return 'border-red-300 text-red-700 bg-red-50';
        default: return 'border-gray-300 text-gray-700 bg-gray-50';
      }
    } else if (type === 'initiative') {
      switch (status) {
        case 'sedang_berjalan': return 'border-blue-300 text-blue-700 bg-blue-50';
        case 'selesai': return 'border-green-300 text-green-700 bg-green-50';
        case 'dibatalkan': return 'border-red-300 text-red-700 bg-red-50';
        default: return 'border-gray-300 text-gray-700 bg-gray-50';
      }
    }
    return 'border-gray-300 text-gray-700 bg-gray-50';
  };

  const getConnectedItems = (itemId: string) => {
    const item = networkItems.find(i => i.id === itemId);
    if (!item) return [];
    
    return item.connections.map(connId => 
      networkItems.find(i => i.id === connId)
    ).filter(Boolean);
  };

  const groupItemsByType = () => {
    const objectives = filteredItems.filter(i => i.type === 'objective');
    const keyResults = filteredItems.filter(i => i.type === 'key_result');
    const initiatives = filteredItems.filter(i => i.type === 'initiative');
    
    return { objectives, keyResults, initiatives };
  };

  const { objectives: objItems, keyResults: krItems, initiatives: initItems } = groupItemsByType();

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collaborative Goal Network</h2>
          <p className="text-gray-600">Visualisasi koneksi antara objective, angka target, dan inisiatif</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter tampilan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Koneksi</SelectItem>
              <SelectItem value="objectives">Objective Focus</SelectItem>
              <SelectItem value="key_results">Angka Target Focus</SelectItem>
              <SelectItem value="initiatives">Inisiatif Focus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Network Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Network Visualization Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Network Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Objectives Level */}
                {objItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Objectives ({objItems.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {objItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getItemIcon(item.type)}
                              <h4 className="font-medium text-blue-900">{item.title}</h4>
                            </div>
                            <Badge className={getStatusColor(item.status, item.type)}>
                              {item.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{item.progress?.toFixed(0) || 0}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${item.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-blue-600">
                              Owner: {item.ownerName} • {item.connections.length} koneksi
                            </p>
                          </div>

                          {/* Connection indicators */}
                          {item.connections.length > 0 && (
                            <div className="mt-3 flex items-center text-xs text-blue-500">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Terhubung ke {item.connections.length} angka target
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Results Level */}
                {krItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Angka Target ({krItems.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {krItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 border-2 border-green-200 rounded-lg bg-green-50 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getItemIcon(item.type)}
                              <h4 className="font-medium text-green-900 text-sm">{item.title}</h4>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{item.progress?.toFixed(0) || 0}%</span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-1.5">
                              <div 
                                className="bg-green-600 h-1.5 rounded-full" 
                                style={{ width: `${item.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-green-600">
                              PIC: {item.ownerName}
                            </p>
                          </div>

                          {/* Connection indicators */}
                          {item.connections.length > 0 && (
                            <div className="mt-2 flex items-center text-xs text-green-500">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              {item.connections.length} koneksi
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initiatives Level */}
                {initItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Inisiatif ({initItems.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {initItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getItemIcon(item.type)}
                              <h4 className="font-medium text-purple-900 text-sm">{item.title}</h4>
                            </div>
                            <Badge className={getStatusColor(item.status, item.type)}>
                              {item.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{item.progress?.toFixed(0) || 0}%</span>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-1.5">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full" 
                                style={{ width: `${item.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-purple-600">
                              PIC: {item.ownerName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">Objective</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Angka Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-sm">Inisiatif</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Details */}
          {selectedItem && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {getItemIcon(selectedItem.type)}
                  Detail Item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{selectedItem.title}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedItem.type === 'objective' ? 'Objective' :
                     selectedItem.type === 'key_result' ? 'Angka Target' : 'Inisiatif'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Progress</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{selectedItem.progress?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${selectedItem.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedItem.status, selectedItem.type)}>
                    {selectedItem.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Owner</p>
                  <p className="text-sm">{selectedItem.ownerName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Connected Items</p>
                  <p className="text-sm">{selectedItem.connections.length} koneksi</p>
                  
                  {selectedItem.connections.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {getConnectedItems(selectedItem.id).map((connItem: any) => (
                        <div key={connItem.id} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-1">
                            {getItemIcon(connItem.type)}
                            <span>{connItem.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}