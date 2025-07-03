import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle, Lightbulb, AlertTriangle, Star, X, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface AIInsight {
  type: 'suggestion' | 'warning' | 'tip' | 'celebration';
  title: string;
  message: string;
  confidence: number;
  actionable?: boolean;
  context?: string;
}

interface AIHelpBubbleProps {
  context: 'dashboard' | 'objective_detail' | 'key_result_detail' | 'check_in' | 'create_okr';
  data?: any;
  position?: 'top-right' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function AIHelpBubble({ 
  context, 
  data, 
  position = 'bottom-right',
  className = "" 
}: AIHelpBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Query AI insights based on context
  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['ai-insights', context, (user as any)?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user || !(user as any)?.id) return [];
      
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: (user as any).id,
          context,
          data
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }
      
      const result = await response.json();
      return result as AIInsight[];
    },
    enabled: Boolean(isAuthenticated && isOpen && user),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-refresh insights when context or data changes
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [context, data, refetch, isOpen]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'tip':
        return <HelpCircle className="w-4 h-4 text-green-500" />;
      case 'celebration':
        return <Star className="w-4 h-4 text-purple-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'suggestion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'tip':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'celebration':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContextLabel = (context: string) => {
    switch (context) {
      case 'dashboard':
        return 'Bantuan Dashboard';
      case 'objective_detail':
        return 'Bantuan Goal';
      case 'key_result_detail':
        return 'Bantuan Ukuran Keberhasilan';
      case 'check_in':
        return 'Bantuan Check-in';
      case 'create_okr':
        return 'Bantuan Buat OKR';
      default:
        return 'Bantuan AI';
    }
  };

  const dismissInsight = (index: number) => {
    setDismissedInsights(prev => [...prev, `${context}-${index}`]);
  };

  // Fallback insights when API is unavailable
  const getFallbackInsights = (): AIInsight[] => {
    switch (context) {
      case 'dashboard':
        return [
          {
            type: 'tip',
            title: 'Tip Dashboard',
            message: 'Gunakan filter status dan siklus untuk fokus pada OKR yang perlu perhatian khusus.',
            confidence: 0.9,
            actionable: true,
            context: 'dashboard_navigation'
          },
          {
            type: 'suggestion',
            title: 'Saran Produktivitas',
            message: 'Lakukan check-in rutin setiap minggu untuk memantau kemajuan Key Results.',
            confidence: 0.8,
            actionable: true,
            context: 'progress_tracking'
          }
        ];
      case 'objective_detail':
        return [
          {
            type: 'tip',
            title: 'Tip Key Results',
            message: 'Pastikan setiap Key Result memiliki target yang spesifik dan terukur.',
            confidence: 0.9,
            actionable: true,
            context: 'key_results_best_practice'
          },
          {
            type: 'suggestion',
            title: 'Saran Initiative',
            message: 'Buat initiative yang konkret untuk mencapai setiap Key Result.',
            confidence: 0.8,
            actionable: true,
            context: 'initiative_planning'
          }
        ];
      default:
        return [
          {
            type: 'tip',
            title: 'Tip OKR',
            message: 'Sistem OKR membantu meningkatkan fokus dan alignment dalam tim.',
            confidence: 0.8,
            actionable: false,
            context: 'general_okr'
          }
        ];
    }
  };

  // Use API insights if available, otherwise use fallback
  const displayInsights = (insights && insights.length > 0) ? insights : getFallbackInsights();
  
  const activeInsights = displayInsights?.filter((_, index) => 
    !dismissedInsights.includes(`${context}-${index}`)
  ) || [];

  const hasNewInsights = activeInsights.length > 0;

  return (
    <div className={`fixed z-50 ${className}`} style={{
      right: position.includes('right') ? '1rem' : 'auto',
      left: position.includes('left') ? '1rem' : 'auto',
      top: position.includes('top') ? '1rem' : 'auto',
      bottom: position.includes('bottom') ? '1rem' : 'auto',
    }}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`relative rounded-full p-2 shadow-lg border-2 bg-white hover:bg-blue-50 transition-all duration-200 ${
              hasNewInsights ? 'border-blue-500 animate-pulse' : 'border-gray-300'
            }`}
          >
            <div className="relative">
              <Sparkles className={`w-5 h-5 ${hasNewInsights ? 'text-blue-600' : 'text-gray-600'}`} />
              {hasNewInsights && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{activeInsights.length}</span>
                </div>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-80 p-0 shadow-xl border-2 border-blue-100" 
          align="end"
          side={position.includes('top') ? 'bottom' : 'top'}
        >
          <Card className="border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                {getContextLabel(context)}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Menganalisis...</span>
                </div>
              ) : activeInsights.length === 0 ? (
                <div className="text-center py-4">
                  <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Tidak ada insight yang tersedia saat ini
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
                    className="mt-2"
                  >
                    Muat Ulang
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeInsights.map((insight, index) => (
                    <div key={index} className="relative p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium text-gray-900 leading-tight">
                              {insight.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissInsight(index)}
                              className="h-auto p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {insight.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getInsightBadgeColor(insight.type)}`}
                            >
                              {insight.type === 'suggestion' && 'Saran'}
                              {insight.type === 'warning' && 'Peringatan'}
                              {insight.type === 'tip' && 'Tips'}
                              {insight.type === 'celebration' && 'Selamat'}
                            </Badge>
                            
                            {insight.confidence && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  {Math.round(insight.confidence * 100)}% yakin
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {insight.actionable && (
                            <div className="pt-1">
                              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                Dapat ditindaklanjuti
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        // Reset dismissed insights
                        setDismissedInsights([]);
                        // Try to refetch from API
                        refetch();
                      }}
                      disabled={isLoading}
                      className="w-full text-xs"
                    >
                      <Sparkles className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                      {isLoading ? 'Memuat...' : 'Muat Insight Baru'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default AIHelpBubble;