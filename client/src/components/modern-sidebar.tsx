import { Link, useLocation } from "wouter";
import { 
  Home,
  MessageSquare,
  BarChart3,
  Calendar,
  CreditCard,
  Settings
} from "lucide-react";

export default function ModernSidebar() {
  const [location] = useLocation();
  
  const navigation = [
    { name: "Home", icon: Home, href: "/", active: location === "/" },
    { name: "OKR", icon: MessageSquare, href: "/okr-structure", active: location.includes("/okr") || location.includes("/objective") },
    { name: "Analytics", icon: BarChart3, href: "/analytics", active: location === "/analytics" },
    { name: "Calendar", icon: Calendar, href: "/cycles", active: location === "/cycles" },
    { name: "Finance", icon: CreditCard, href: "/finance", active: location === "/finance" },
    { name: "Settings", icon: Settings, href: "/settings", active: location === "/settings" },
  ];

  return (
    <div className="w-64 bg-[#2D2A7A] text-white flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-indigo-500/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-[#2D2A7A] rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          <span className="text-lg font-semibold">Logo</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer
                    ${item.active 
                      ? 'bg-indigo-600/30 text-white border-l-4 border-white' 
                      : 'text-indigo-200 hover:text-white hover:bg-indigo-600/20'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}