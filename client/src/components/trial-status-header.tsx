import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function TrialStatusHeader() {
  // Fetch trial status and user limit
  const { data: trialStatus } = useQuery({
    queryKey: ["/api/trial-status"],
  });

  const { data: userLimit } = useQuery({
    queryKey: ["/api/user-limit-status"],
  });

  // Only show during active trial
  if (!trialStatus?.isTrialActive) {
    return null;
  }

  const daysRemaining = trialStatus?.daysRemaining || 0;
  const isExpiring = daysRemaining <= 2;
  const isNearUserLimit = userLimit && userLimit.usersRemaining <= 1;

  return (
    <div 
      className={`w-full px-2 sm:px-4 py-2 border-b fixed top-0 left-0 right-0 z-40 ${
        isExpiring ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
      }`}
      style={{ minHeight: '44px', height: '44px' }}
    >
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-full ${isExpiring ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <Clock className={`h-4 w-4 ${isExpiring ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">
            Masa uji coba akan berakhir dalam {daysRemaining} hari
          </span>
        </div>

        <Link to="/upgrade-package">
          <Button 
            size="sm" 
            className="h-7 px-3 text-xs bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          >
            Upgrade Sekarang
          </Button>
        </Link>

        {isExpiring && (
          <div className="text-sm text-red-600 font-medium">
            ⚠️ Masa uji coba akan berakhir dalam {daysRemaining} hari!
          </div>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden">
        {/* First row - Main trial info */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded-full ${isExpiring ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <Clock className={`h-3 w-3 ${isExpiring ? 'text-red-600' : 'text-yellow-600'}`} />
            </div>
            <span className="text-xs font-medium text-gray-700">
              Masa uji coba akan berakhir dalam {daysRemaining} hari
            </span>
          </div>
          <Link to="/pricing">
            <Button 
              size="sm" 
              className="h-6 px-2 text-xs bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              Upgrade
            </Button>
          </Link>
        </div>

        

        {/* Expiring warning for mobile */}
        {isExpiring && (
          <div className="text-xs text-red-600 font-medium mt-1 text-center">
            ⚠️ Masa uji coba akan berakhir dalam {daysRemaining} hari!
          </div>
        )}
      </div>
    </div>
  );
}