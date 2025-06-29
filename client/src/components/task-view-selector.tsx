import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  List, 
  Calendar,
  Grid3x3
} from "lucide-react";

export type ViewMode = 'kanban' | 'list' | 'timeline';

interface TaskViewSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function TaskViewSelector({ currentView, onViewChange }: TaskViewSelectorProps) {
  const views = [
    {
      id: 'kanban' as ViewMode,
      label: 'Kanban',
      icon: Grid3x3,
      description: 'Drag and drop cards'
    },
    {
      id: 'list' as ViewMode,
      label: 'List',
      icon: List,
      description: 'Table view'
    },
    {
      id: 'timeline' as ViewMode,
      label: 'Timeline',
      icon: Calendar,
      description: 'Grouped by due date'
    }
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {views.map(view => {
        const Icon = view.icon;
        const isActive = currentView === view.id;
        
        return (
          <Button
            key={view.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange(view.id)}
            className={`flex items-center gap-2 transition-all ${
              isActive 
                ? "bg-white shadow-sm text-gray-900" 
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title={view.description}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </Button>
        );
      })}
    </div>
  );
}