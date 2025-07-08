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
      className={`w-full px-4 py-2 border-b fixed top-0 left-0 right-0 z-50 ${
        isExpiring ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
      }`}
      style={{ height: '44px' }}
    >
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-full ${isExpiring ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <Clock className={`h-4 w-4 ${isExpiring ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">
            Trial Period Active
          </span>
          <Badge variant={isExpiring ? "destructive" : "secondary"} className="text-xs">
            {daysRemaining} hari tersisa
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Paket: {trialStatus?.currentPlan}
          </span>
          
          {userLimit && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Users className="h-3 w-3" />
              <span>{userLimit.currentUsers}/{userLimit.maxUsers} users</span>
              {isNearUserLimit && (
                <AlertTriangle className="h-3 w-3 text-yellow-600" />
              )}
            </div>
          )}

          <Link to="/pricing">
            <Button 
              size="sm" 
              className="h-7 px-3 text-xs bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              Upgrade Sekarang
            </Button>
          </Link>
        </div>

        {isExpiring && (
          <div className="text-sm text-red-600 font-medium">
            ⚠️ Trial berakhir dalam {daysRemaining} hari!
          </div>
        )}
      </div>
    </div>
  );
}