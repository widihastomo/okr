import { useQuery } from "@tanstack/react-query";
import { Clock, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface TrialStatus {
  isTrialActive: boolean;
  daysRemaining: number;
  trialEndDate: string;
  currentPlan: string;
}

interface UserLimitStatus {
  currentUsers: number;
  maxUsers: number;
  canAddUsers: boolean;
  usersRemaining: number;
}

export default function TrialStatusBanner() {
  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ["/api/trial-status"],
    refetchInterval: 60000, // Check every minute
  });

  const { data: userLimit } = useQuery<UserLimitStatus>({
    queryKey: ["/api/user-limit-status"],
    refetchInterval: 60000, // Check every minute
  });

  // Don't show banner if trial is not active or data is loading
  if (!trialStatus?.isTrialActive) {
    return null;
  }

  const isExpiring = trialStatus.daysRemaining <= 2;
  const isNearUserLimit = userLimit && userLimit.usersRemaining <= 1;

  return (
    <Card className={`mb-6 border-l-4 ${isExpiring ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isExpiring ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <Clock className={`h-5 w-5 ${isExpiring ? 'text-red-600' : 'text-yellow-600'}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Trial Period Active</h3>
                <Badge variant={isExpiring ? "destructive" : "secondary"}>
                  {trialStatus.daysRemaining} hari tersisa
                </Badge>
              </div>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-600">
                  Paket: {trialStatus.currentPlan}
                </p>
                {userLimit && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{userLimit.currentUsers}/{userLimit.maxUsers} users</span>
                    {isNearUserLimit && (
                      <AlertTriangle className="h-4 w-4 text-yellow-600 ml-1" />
                    )}
                  </div>
                )}
              </div>
              {isExpiring && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Trial berakhir dalam {trialStatus.daysRemaining} hari! Upgrade untuk melanjutkan akses.
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Link to="/organization-settings">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                Upgrade Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}