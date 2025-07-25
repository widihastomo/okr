import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { OKRWithKeyResults } from "@shared/schema";

function GoalDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch goal data
  const { data: goal, isLoading } = useQuery<OKRWithKeyResults>({
    queryKey: [`/api/objectives/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Goal tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
        
        {/* Goal Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {goal.title}
          </h1>
          {goal.description && (
            <p className="text-gray-600 text-lg">
              {goal.description}
            </p>
          )}
        </div>
      </div>

      {/* Goal Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Goal Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">
                    {goal.description || "No description available"}
                  </p>
                </div>
                
                {/* Key Results Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Key Results</h3>
                  {goal.keyResults && goal.keyResults.length > 0 ? (
                    <div className="space-y-2">
                      {goal.keyResults.map((kr) => (
                        <div
                          key={kr.id}
                          className="p-3 border rounded-lg bg-gray-50"
                        >
                          <h4 className="font-medium">{kr.title}</h4>
                          {kr.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {kr.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No key results defined</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Goal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className="ml-2 capitalize">{goal.status}</span>
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <span className="ml-2 capitalize">{goal.type}</span>
                </div>
                <div>
                  <span className="font-medium">Priority:</span>
                  <span className="ml-2 capitalize">{goal.priority}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default GoalDetail;