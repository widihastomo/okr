import React, { useEffect, useRef, useState } from "react";

type ConnectorLineProps = {
  fromId: string; // ID elemen sumber
  toId: string;   // ID elemen tujuan
  color?: string; // Warna garis
  strokeWidth?: number; // Ketebalan garis
};

export const ConnectorLine: React.FC<ConnectorLineProps> = ({ 
  fromId, 
  toId, 
  color = "#9CA3AF", 
  strokeWidth = 2 
}) => {
  const [lineCoords, setLineCoords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateLine = () => {
      const fromEl = document.getElementById(fromId);
      const toEl = document.getElementById(toId);

      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        
        // Get scroll position using both methods for better compatibility
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // Calculate connection points with scroll offset
        const x1 = fromRect.right + scrollX;
        const y1 = fromRect.top + fromRect.height / 2 + scrollY;

        const x2 = toRect.left + scrollX;
        const y2 = toRect.top + toRect.height / 2 + scrollY;

        setLineCoords({ x1, y1, x2, y2 });
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Initial update
    updateLine();
    
    // Update on resize and scroll with passive listeners for better performance
    window.addEventListener("resize", updateLine);
    window.addEventListener("scroll", updateLine, { passive: true });
    
    // Use MutationObserver to detect DOM changes
    const observer = new MutationObserver(updateLine);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true 
    });

    return () => {
      window.removeEventListener("resize", updateLine);
      window.removeEventListener("scroll", updateLine);
      observer.disconnect();
    };
  }, [fromId, toId]);

  if (!isVisible) return null;

  const { x1, y1, x2, y2 } = lineCoords;

  return (
    <svg
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100vw", 
        height: "100vh", 
        pointerEvents: "none", 
        zIndex: 1 
      }}
    >
      <defs>
        <marker 
          id={`arrow-${fromId}-${toId}`} 
          markerWidth="10" 
          markerHeight="10" 
          refX="9" 
          refY="3" 
          orient="auto" 
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        markerEnd={`url(#arrow-${fromId}-${toId})`}
        strokeDasharray="5,5"
      />
    </svg>
  );
};