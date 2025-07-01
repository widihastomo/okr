import { Card, CardContent } from "@/components/ui/card";
import { Target, CheckCircle, AlertTriangle, TrendingUp, Clock, Trophy } from "lucide-react";
import type { OKRWithKeyResults } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  okrs: OKRWithKeyResults[];
  isLoading?: boolean;
}

export default function StatsOverview({ okrs, isLoading }: StatsOverviewProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // Calculate stats from filtered OKR data
  const calculateStats = () => {
    if (!okrs || okrs.length === 0) {
      return {
        totalOKRs: 0,
        onTrack: 0,
        atRisk: 0,
        completed: 0,
        behind: 0,
        avgProgress: 0
      };
    }

    const totalOKRs = okrs.length;
    const onTrack = okrs.filter(okr => okr.status === 'on_track').length;
    const atRisk = okrs.filter(okr => okr.status === 'at_risk').length;
    const completed = okrs.filter(okr => okr.status === 'completed').length;
    const behind = okrs.filter(okr => okr.status === 'behind').length;
    const inProgress = okrs.filter(okr => okr.status === 'in_progress').length;
    
    // Calculate average progress
    const totalProgress = okrs.reduce((sum, okr) => sum + (okr.overallProgress || 0), 0);
    const avgProgress = totalOKRs > 0 ? Math.round(totalProgress / totalOKRs) : 0;

    return {
      totalOKRs,
      onTrack,
      atRisk,
      completed,
      behind,
      inProgress,
      avgProgress
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total OKRs",
      value: stats.totalOKRs,
      icon: Target,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: Trophy,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Behind",
      value: stats.behind,
      icon: Clock,
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    },
    {
      title: "Avg Progress",
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  // Auto-rotate cards on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % statCards.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [statCards.length]);

  // Handle touch/mouse events for swipe
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    setStartX(pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const x = pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (!sliderRef.current) return;
    
    const cardWidth = sliderRef.current.offsetWidth;
    const scrollPosition = sliderRef.current.scrollLeft;
    const newIndex = Math.round(scrollPosition / cardWidth);
    setCurrentCard(Math.max(0, Math.min(newIndex, statCards.length - 1)));
    
    // Snap to card
    sliderRef.current.scrollTo({
      left: newIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  const goToCard = (index: number) => {
    setCurrentCard(index);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: index * sliderRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* Mobile Slider */}
      <div className="sm:hidden mb-6">
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="w-full flex-shrink-0 snap-center px-4">
                  <Card className={cn(
                    "shadow-lg border border-gray-200 transition-all duration-300",
                    currentCard === index ? "scale-105" : "scale-95 opacity-80"
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                          <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          
          {/* Dot indicators */}
          <div className="flex justify-center mt-4 gap-2">
            {statCards.map((_, index) => (
              <button
                key={index}
                onClick={() => goToCard(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  currentCard === index 
                    ? "bg-blue-600 w-6" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm border border-gray-200">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600 truncate">{stat.title}</p>
                    <p className="text-lg lg:text-2xl font-semibold text-gray-900 mt-0.5">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
