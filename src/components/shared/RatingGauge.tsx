import React from 'react';
import { Badge } from '../ui/badge';

interface RatingGaugeProps {
  rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S';
  ratingCategory?: string | string[]; // Can be single string or array
  confidence: number; // 0-100
  sparklineData?: number[]; // confidence history
}

export function RatingGauge({ rating, ratingCategory, confidence, sparklineData = [] }: RatingGaugeProps) {
  // Handle both single string and array of categories
  const categories = Array.isArray(ratingCategory) ? ratingCategory : (ratingCategory ? [ratingCategory] : []);
  // Map rating to color and percentage range
  const getRatingConfig = (rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S') => {
    const configs: Record<string, { color: string; bgColor: string; range: string }> = {
      'S': { color: 'rgb(168, 85, 247)', bgColor: 'rgba(168, 85, 247, 0.1)', range: 'Special' },
      'A': { color: 'rgb(16, 185, 129)', bgColor: 'rgba(16, 185, 129, 0.1)', range: '90-100%' },
      'B': { color: 'rgb(34, 197, 94)', bgColor: 'rgba(34, 197, 94, 0.1)', range: '80-89%' },
      'C': { color: 'rgb(234, 179, 8)', bgColor: 'rgba(234, 179, 8, 0.1)', range: '70-79%' },
      'D': { color: 'rgb(249, 115, 22)', bgColor: 'rgba(249, 115, 22, 0.1)', range: '60-69%' },
      'E': { color: 'rgb(239, 68, 68)', bgColor: 'rgba(239, 68, 68, 0.1)', range: '50-59%' },
      'F': { color: 'rgb(244, 63, 94)', bgColor: 'rgba(244, 63, 94, 0.1)', range: '<50%' },
    };
    return configs[rating] || configs['F'];
  };

  const config = getRatingConfig(rating);
  const circumference = 2 * Math.PI * 36; // radius = 36
  const offset = circumference - (confidence / 100) * circumference;

  // Generate sparkline path
  const generateSparklinePath = (data: number[]) => {
    if (data.length < 2) return '';

    const width = 60;
    const height = 20;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (value / 100) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Circular Gauge */}
      <div className="relative" style={{ width: '80px', height: '80px' }}>
        {/* Background circle */}
        <svg className="absolute inset-0 -rotate-90" width="80" height="80">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke={config.bgColor}
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke={config.color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold" style={{ color: config.color }}>
            {rating}
          </div>
        </div>
      </div>

      {/* Sparkline and info */}
      <div className="flex flex-col gap-1">
        {/* Rating Grade with Categories */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold" style={{ color: config.color }}>
            {rating}
          </span>
          {categories.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {categories.join(', ')}
            </span>
          )}
        </div>

        {sparklineData.length >= 2 && (
          <svg width="60" height="20" className="opacity-60">
            <path
              d={generateSparklinePath(sparklineData)}
              fill="none"
              stroke={config.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <div className="text-xs text-muted-foreground">
          Confidence Range
        </div>
        <Badge
          variant="outline"
          className="text-xs px-1.5 py-0"
          style={{
            backgroundColor: config.bgColor,
            color: config.color,
            borderColor: config.color + '33'
          }}
        >
          {config.range}
        </Badge>
      </div>
    </div>
  );
}
