"use client"
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ShapeGridProps {
  speed?: number;
  squareSize?: number;
  direction?: 'diagonal' | 'horizontal' | 'vertical';
  borderColor?: string;
  hoverFillColor?: string;
  shape?: 'square' | 'circle';
  hoverTrailAmount?: number;
  className?: string;
}

export function ShapeGrid({
  speed = 0.5,
  squareSize = 40,
  direction = 'diagonal',
  borderColor = '#2F293A',
  hoverFillColor = '#222222',
  shape = 'square',
  hoverTrailAmount = 0,
  className
}: ShapeGridProps) {
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateGrid = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setCols(Math.ceil(clientWidth / squareSize) + 2);
        setRows(Math.ceil(clientHeight / squareSize) + 2);
      } else {
        setCols(Math.ceil(window.innerWidth / squareSize) + 2);
        setRows(Math.ceil(window.innerHeight / squareSize) + 2);
      }
    };
    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, [squareSize]);

  return (
    <div 
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-auto", className)} 
    >
      <div 
        className="absolute inset-0 flex flex-wrap" 
        style={{ 
          width: `${cols * squareSize}px`, 
          height: `${rows * squareSize}px`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div
            key={i}
            className="transition-colors duration-500 ease-out"
            style={{
              width: squareSize,
              height: squareSize,
              borderRight: `1px solid ${borderColor}`,
              borderBottom: `1px solid ${borderColor}`,
              borderRadius: shape === 'circle' ? '50%' : '0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverFillColor;
              e.currentTarget.style.transitionDuration = '0ms';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transitionDuration = '500ms';
            }}
          />
        ))}
      </div>
    </div>
  );
}
