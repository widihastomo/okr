import { Target, BarChart3, Users, Building, ChartLine, Settings, User } from "lucide-react";

export default function Sidebar() {
  const navigation = [
    { name: "Dashboard", icon: ChartLine, active: true },
    { name: "My OKRs", icon: Target },
    { name: "Team OKRs", icon: Users },
    { name: "Company OKRs", icon: Building },
    { name: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">OKR Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href="#"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                item.active
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">Product Manager</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
