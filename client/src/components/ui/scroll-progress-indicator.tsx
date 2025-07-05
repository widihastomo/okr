import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ScrollProgressIndicatorProps {
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function ScrollProgressIndicator({ containerRef, className }: ScrollProgressIndicatorProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      
      // Only show indicator when content is scrollable
      if (maxScroll <= 5) { // Small threshold to account for rounding
        setIsVisible(false);
        return;
      }
      
      setIsVisible(true);
      const progress = Math.min(Math.max((scrollTop / maxScroll) * 100, 0), 100);
      setScrollProgress(progress);
    };

    // Initial check with delay to ensure content is rendered
    const timeoutId = setTimeout(updateProgress, 100);

    container.addEventListener("scroll", updateProgress, { passive: true });
    
    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      // Delay update to ensure layout is stable
      setTimeout(updateProgress, 50);
    });
    resizeObserver.observe(container);

    // Also observe child elements for content changes
    const childObserver = new MutationObserver(() => {
      setTimeout(updateProgress, 50);
    });
    childObserver.observe(container, { childList: true, subtree: true });

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("scroll", updateProgress);
      resizeObserver.disconnect();
      childObserver.disconnect();
    };
  }, [containerRef]);

  if (!isVisible) return null;

  return (
    <div 
      ref={progressRef}
      className={cn(
        "absolute right-1 top-1 bottom-1 w-1 bg-gray-100 rounded-full opacity-0 transition-opacity duration-200 shadow-inner",
        scrollProgress > 0 && "opacity-100",
        className
      )}
    >
      <div
        className="bg-gradient-to-b from-blue-400 to-blue-600 rounded-full transition-all duration-150 ease-out w-full shadow-sm"
        style={{
          height: `${scrollProgress}%`,
          transform: `translateY(0%)`,
        }}
      />
    </div>
  );
}

// Hook for managing scroll progress state
export function useScrollProgress(containerRef: React.RefObject<HTMLDivElement>) {
  const [scrollState, setScrollState] = useState({
    isAtTop: true,
    isAtBottom: false,
    scrollProgress: 0,
    canScroll: false
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const canScroll = maxScroll > 0;
      
      if (!canScroll) {
        setScrollState({
          isAtTop: true,
          isAtBottom: true,
          scrollProgress: 0,
          canScroll: false
        });
        return;
      }

      const progress = Math.min(Math.max((scrollTop / maxScroll) * 100, 0), 100);
      const isAtTop = scrollTop <= 1;
      const isAtBottom = scrollTop >= maxScroll - 1;

      setScrollState({
        isAtTop,
        isAtBottom,
        scrollProgress: progress,
        canScroll: true
      });
    };

    updateScrollState();
    
    container.addEventListener("scroll", updateScrollState, { passive: true });
    
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return scrollState;
}