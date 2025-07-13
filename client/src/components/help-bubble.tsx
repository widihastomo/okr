import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  HelpCircle, 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2,
  Sparkles,
  X,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AIInsight {
  type: 'suggestion' | 'warning' | 'tip' | 'celebration';
  title: string;
  message: string;
  confidence: number;
  actionable?: boolean;
  context?: string;
}

interface ContextualHelpRequest {
  userId: string;
  context: 'dashboard' | 'objective_detail' | 'key_result_detail' | 'check_in' | 'create_goal';
  data?: any;
}

interface HelpBubbleProps {
  context: ContextualHelpRequest['context'];
  userId: string;
  data?: any;
  className?: string;
  variant?: 'floating' | 'inline';
  autoShow?: boolean;
}

const getInsightIcon = (type: AIInsight['type']) => {
  switch (type) {
    case 'suggestion':
      return <Lightbulb className="h-4 w-4 text-blue-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'tip':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'celebration':
      return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getInsightBadgeVariant = (type: AIInsight['type']) => {
  switch (type) {
    case 'suggestion':
      return 'default';
    case 'warning':
      return 'destructive';
    case 'tip':
      return 'secondary';
    case 'celebration':
      return 'outline';
    default:
      return 'outline';
  }
};

const getContextTitle = (context: string) => {
  switch (context) {
    case 'dashboard':
      return 'Insight Dashboard';
    case 'objective_detail':
      return 'Saran Objektif';
    case 'key_result_detail':
      return 'Analisis Key Result';
    case 'check_in':
      return 'Panduan Update';
    case 'create_goal':
      return 'Tips Pembuatan Goal';
    default:
      return 'AI Assistant';
  }
};

export function HelpBubble({ 
  context, 
  userId, 
  data, 
  className = "",
  variant = 'floating',
  autoShow = false 
}: HelpBubbleProps) {
  const [isOpen, setIsOpen] = useState(autoShow);
  const [isVisible, setIsVisible] = useState(true);

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['/api/ai-insights', context, userId],
    queryFn: async (): Promise<AIInsight[]> => {
      try {
        const response = await fetch("/api/ai-insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            context,
            data
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result as AIInsight[];
      } catch (error) {
        console.error("Failed to fetch AI insights:", error);
        return [];
      }
    },
    enabled: isOpen && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (autoShow && insights && insights.length > 0) {
      setIsOpen(true);
    }
  }, [autoShow, insights]);

  if (!isVisible) return null;

  const hasInsights = insights && insights.length > 0;
  const highPriorityInsights = insights?.filter(insight => 
    insight.type === 'warning' || (insight.type === 'suggestion' && insight.confidence > 0.8)
  ) || [];

  const triggerButton = (
    <Button
      variant={hasInsights && highPriorityInsights.length > 0 ? "default" : "outline"}
      size="sm"
      className={`relative ${variant === 'floating' ? 'shadow-lg' : ''} ${className}`}
    >
      <Sparkles className="h-4 w-4 mr-1" />
      AI Assistant
      {hasInsights && highPriorityInsights.length > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {highPriorityInsights.length}
        </Badge>
      )}
    </Button>
  );

  return (
    <div className={variant === 'floating' ? 'fixed bottom-4 right-4 z-50' : 'relative'}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0" 
          align={variant === 'floating' ? 'end' : 'center'}
          side={variant === 'floating' ? 'top' : 'bottom'}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  {getContextTitle(context)}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVisible(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Menganalisis data...</span>
                </div>
              )}

              {!isLoading && (!insights || insights.length === 0) && (
                <div className="text-center py-4">
                  <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Belum ada insight untuk konteks ini.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coba lakukan beberapa aktivitas untuk mendapatkan saran AI.
                  </p>
                </div>
              )}

              {!isLoading && insights && insights.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {insights.map((insight, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start gap-2">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {insight.title}
                            </h4>
                            <Badge 
                              variant={getInsightBadgeVariant(insight.type)}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {insight.type === 'suggestion' ? 'Saran' :
                               insight.type === 'warning' ? 'Peringatan' :
                               insight.type === 'tip' ? 'Tips' :
                               insight.type === 'celebration' ? 'Selamat!' : insight.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {insight.message}
                          </p>
                          {insight.actionable && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <TrendingUp className="h-3 w-3" />
                              <span>Actionable</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {index < insights.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-gray-500 text-center">
                  💡 Insight berdasarkan analisis AI dari data Goal Anda
                </p>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Specialized components for specific contexts
export function DashboardHelpBubble({ userId }: { userId: string }) {
  return (
    <HelpBubble
      context="dashboard"
      userId={userId}
      variant="inline"
      className="ml-2"
    />
  );
}

export function ObjectiveDetailHelpBubble({ userId, objectiveId }: { userId: string; objectiveId: string }) {
  return (
    <HelpBubble
      context="objective_detail"
      userId={userId}
      data={{ objectiveId }}
      variant="inline"
      className="ml-2"
    />
  );
}

export function KeyResultDetailHelpBubble({ userId, keyResultId }: { userId: string; keyResultId: string }) {
  return (
    <HelpBubble
      context="key_result_detail"
      userId={userId}
      data={{ keyResultId }}
      variant="inline"
      className="ml-2"
    />
  );
}

export function CheckInHelpBubble({ userId, keyResultId }: { userId: string; keyResultId: string }) {
  return (
    <HelpBubble
      context="check_in"
      userId={userId}
      data={{ keyResultId }}
      variant="inline"
      className="ml-2"
      autoShow={true}
    />
  );
}

export function CreateGoalHelpBubble({ userId }: { userId: string }) {
  return (
    <HelpBubble
      context="create_goal"
      userId={userId}
      variant="inline"
      className="ml-2"
      autoShow={true}
    />
  );
}

// Floating help bubble that appears globally
export function FloatingHelpBubble({ userId, context }: { userId: string; context: ContextualHelpRequest['context'] }) {
  return (
    <HelpBubble
      context={context}
      userId={userId}
      variant="floating"
    />
  );
}