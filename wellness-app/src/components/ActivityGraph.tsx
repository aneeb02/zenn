'use client';

import { useEffect, useRef } from 'react';

interface ActivityGraphProps {
  data: number[];
  labels: string[];
  height?: number;
  color?: 'purple' | 'pink' | 'blue';
}

export default function ActivityGraph({ 
  data, 
  labels, 
  height = 200,
  color = 'purple' 
}: ActivityGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colors = {
    purple: {
      line: '#8b5cf6',
      gradient: ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0)']
    },
    pink: {
      line: '#ec4899',
      gradient: ['rgba(236, 72, 153, 0.3)', 'rgba(236, 72, 153, 0)']
    },
    blue: {
      line: '#3b82f6',
      gradient: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0)']
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Calculate points
    const padding = 20;
    const graphWidth = rect.width - padding * 2;
    const graphHeight = height - padding * 2;
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const valueRange = maxValue - minValue || 1;

    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * graphWidth,
      y: padding + (1 - (value - minValue) / valueRange) * graphHeight
    }));

    // Create gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, colors[color].gradient[0]);
    gradient.addColorStop(1, colors[color].gradient[1]);

    // Draw area
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw smooth curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      const yMid = (points[i].y + points[i + 1].y) / 2;
      const cp1x = (xMid + points[i].x) / 2;
      const cp2x = (xMid + points[i + 1].x) / 2;
      
      ctx.quadraticCurveTo(cp1x, points[i].y, xMid, yMid);
      ctx.quadraticCurveTo(cp2x, points[i + 1].y, points[i + 1].x, points[i + 1].y);
    }

    ctx.strokeStyle = colors[color].line;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw points
    points.forEach((point, index) => {
      // Outer circle
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = colors[color].line;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = colors[color].line;
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
      const x = padding + (index / (labels.length - 1)) * graphWidth;
      ctx.fillText(label, x, height - 5);
    });

  }, [data, labels, height, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
