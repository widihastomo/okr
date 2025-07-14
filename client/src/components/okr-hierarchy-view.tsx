import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronDown, 
  Target, 
  Flag, 
  Lightbulb, 
  CheckSquare,
  Plus,
  Calendar,
  User
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  assignedTo?: number;
  dueDate?: string;
  completedAt?: string;
}

interface Initiative {
  id: number;
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "completed" | "on_hold";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  tasks?: Task[];
}

interface KeyResult {
  id: number;
  title: string;
  description?: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  status: string;
  initiatives?: Initiative[];
  progress?: number;
}

interface Objective {
  id: number;
  title: string;
  description?: string;
  status: string;
  keyResults?: KeyResult[];
  overallProgress?: number;
}

const StatusBadge = ({ status, type }: { status: string; type: "objective" | "keyResult" | "initiative" | "task" }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "on_track":
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "at_risk":
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "behind":
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "not_started":
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on_track": return "Sesuai Target";
      case "at_risk": return "Berisiko";
      case "behind": return "Terlambat";
      case "completed": return "Selesai";
      case "in_progress": return "On Progress";
      case "not_started": return "Belum Dimulai";
      case "on_hold": return "Ditunda";
      case "pending": return "Menunggu";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <Badge className={`text-xs ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </Badge>
  );
};

const PriorityBadge = ({ priority }: { priority: "low" | "medium" | "high" }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Tinggi";
      case "medium": return "Sedang";
      case "low": return "Rendah";
      default: return priority;
    }
  };

  return (
    <Badge className={`text-xs ${getPriorityColor(priority)}`}>
      {getPriorityLabel(priority)}
    </Badge>
  );
};

const TaskCard = ({ task }: { task: Task }) => {
  return (
    <Card className="ml-12 mb-2 border-l-4 border-l-purple-300">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-purple-600" />
            <h5 className="font-medium text-sm">{task.title}</h5>
          </div>
          <div className="flex items-center space-x-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} type="task" />
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
        )}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString('id-ID')}</span>
            </div>
          )}
          {task.assignedTo && (
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>Assigned</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const InitiativeCard = ({ initiative }: { initiative: Initiative }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="ml-8 mb-3">
      <Card className="border-l-4 border-l-orange-300">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {initiative.tasks && initiative.tasks.length > 0 ? (
                  isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4" />
                )}
              </button>
              <Lightbulb className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium text-sm">{initiative.title}</h4>
            </div>
            <div className="flex items-center space-x-2">
              <PriorityBadge priority={initiative.priority} />
              <StatusBadge status={initiative.status} type="initiative" />
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {initiative.description && (
            <p className="text-sm text-gray-600 mb-2 ml-6">{initiative.description}</p>
          )}
          <div className="flex items-center space-x-4 text-xs text-gray-500 ml-6">
            {initiative.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(initiative.dueDate).toLocaleDateString('id-ID')}</span>
              </div>
            )}
            {initiative.tasks && (
              <span>{initiative.tasks.length} tasks</span>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isExpanded && initiative.tasks && initiative.tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};

const KeyResultCard = ({ keyResult }: { keyResult: KeyResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = keyResult.progress || 0;

  return (
    <div className="ml-4 mb-4">
      <Card className="border-l-4 border-l-blue-300">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {keyResult.initiatives && keyResult.initiatives.length > 0 ? (
                  isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4" />
                )}
              </button>
              <Flag className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium">{keyResult.title}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={keyResult.status} type="keyResult" />
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="ml-6 space-y-2">
            {keyResult.description && (
              <p className="text-sm text-gray-600">{keyResult.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600">
                {keyResult.currentValue} / {keyResult.targetValue} {keyResult.unit}
              </span>
              <div className="flex-1 max-w-32">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            
            {keyResult.initiatives && (
              <p className="text-xs text-gray-500">{keyResult.initiatives.length} initiatives</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isExpanded && keyResult.initiatives && keyResult.initiatives.map((initiative) => (
        <InitiativeCard key={initiative.id} initiative={initiative} />
      ))}
    </div>
  );
};

const ObjectiveCard = ({ objective }: { objective: Objective }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const progress = objective.overallProgress || 0;

  return (
    <Card className="mb-6 border-l-4 border-l-green-400">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {objective.keyResults && objective.keyResults.length > 0 ? (
                isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5" />
              )}
            </button>
            <Target className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">{objective.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={objective.status} type="objective" />
            <Button size="sm" variant="ghost">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="ml-7 space-y-2">
          {objective.description && (
            <p className="text-sm text-gray-600">{objective.description}</p>
          )}
          
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-48">
              <Progress value={progress} className="h-3" />
            </div>
            <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
          </div>
          
          {objective.keyResults && (
            <p className="text-xs text-gray-500">{objective.keyResults.length} key results</p>
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {objective.keyResults && objective.keyResults.map((keyResult) => (
            <KeyResultCard key={keyResult.id} keyResult={keyResult} />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default function GoalHierarchyView() {
  const { data: objectives, isLoading } = useQuery({
    queryKey: ["/api/goals-with-hierarchy"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Memuat struktur Goal...</p>
        </div>
      </div>
    );
  }

  if (!objectives || objectives.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Goal</h3>
        <p className="text-gray-600 mb-4">
          Mulai dengan membuat objective pertama Anda dan bangun struktur Goal lengkap.
        </p>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Buat Objective Baru
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Struktur Goal</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Objective</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <span>Key Result</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-300 rounded"></div>
            <span>Initiative</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-300 rounded"></div>
            <span>Task</span>
          </div>
        </div>
      </div>
      
      {objectives.map((objective: Objective) => (
        <ObjectiveCard key={objective.id} objective={objective} />
      ))}
    </div>
  );
}