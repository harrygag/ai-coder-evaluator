

import React, { useState } from 'react';
import { HistoricalRecord, PerformanceMetrics } from '../types';

interface PerformanceChartProps {
  history: HistoricalRecord[];
}

interface TooltipData {
    x: number;
    y: number;
    record: HistoricalRecord;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center text-text-secondary/70">
        <div>
          <p className="font-semibold">No performance data yet.</p>
          <p className="text-sm mt-1">Run a simulation and a self-evaluation to see the chart.</p>
        </div>
      </div>
    );
  }

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const width = 500;
  const height = 200;
  const padding = 40;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding;

  const maxScore = 5;
  const dataPoints = history.slice(-10); // Show last 10 records
  const count = dataPoints.length;

  const getX = (index: number) => padding + (count > 1 ? (index / (count - 1)) * innerWidth : innerWidth / 2);
  const getY = (score: number) => height - padding - (score / maxScore) * innerHeight;

  const colors = {
    solutionQuality: '#34d399', // green-400
    managerPerformance: '#818cf8', // indigo-400
    promptQuality: '#fbbf24' // amber-400
  };

  const createPath = (key: keyof typeof colors) => {
    if (count === 0) return "";
    let path = `M ${getX(0)} ${getY(dataPoints[0].metrics[key])}`;
    for (let i = 1; i < count; i++) {
      path += ` L ${getX(i)} ${getY(dataPoints[i].metrics[key])}`;
    }
    return path;
  };

  const handleMouseEnter = (record: HistoricalRecord, index: number) => {
    setTooltip({
      x: getX(index),
      y: getY(record.metrics.managerPerformance), // Use one of the points as a Y-anchor
      record
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-Axis Labels */}
        {[...Array(maxScore + 1)].map((_, i) => (
          <g key={i}>
            <text x={padding - 10} y={getY(i) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {i}
            </text>
            <line
              x1={padding}
              y1={getY(i)}
              x2={width - padding}
              y2={getY(i)}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          </g>
        ))}

        {/* Chart Paths */}
        {Object.keys(colors).map((key) => (
          <path
            key={key}
            d={createPath(key as keyof typeof colors)}
            fill="none"
            stroke={colors[key as keyof typeof colors]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Data Points and Hover Areas */}
        {dataPoints.map((record, index) => (
          <g 
            key={index}
            onMouseEnter={() => handleMouseEnter(record, index)}
            onMouseLeave={handleMouseLeave}
            className="cursor-pointer"
          >
             {/* Invisible rect for easier hover target */}
            <rect 
              x={getX(index) - 10}
              y="0"
              width="20"
              height={height}
              fill="transparent"
            />
            {Object.keys(colors).map((key) => (
              <circle
                key={key}
                cx={getX(index)}
                cy={getY(record.metrics[key as keyof typeof colors])}
                r="4"
                fill={colors[key as keyof typeof colors]}
              />
            ))}
          </g>
        ))}
      </svg>
      
      {/* Tooltip */}
      {tooltip && (
          <div 
              className="absolute p-3 bg-base-300 text-text-primary rounded-lg shadow-lg text-xs w-64 pointer-events-none transition-opacity duration-200 animate-fade-in-up"
              style={{ 
                  left: tooltip.x, 
                  top: tooltip.y,
                  transform: `translate(-50%, -110%)`, // Position above the point
                  opacity: 1
              }}
          >
              <p className="font-bold text-text-secondary mb-2">
                  {new Date(tooltip.record.timestamp).toLocaleString()}
              </p>
              <div className="space-y-1">
                  <div className="flex justify-between"><span>Solution Quality:</span> <span style={{ color: colors.solutionQuality, fontWeight: 'bold' }}>{tooltip.record.metrics.solutionQuality}</span></div>
                  <div className="flex justify-between"><span>Manager Performance:</span> <span style={{ color: colors.managerPerformance, fontWeight: 'bold' }}>{tooltip.record.metrics.managerPerformance}</span></div>
                  <div className="flex justify-between"><span>Prompt Quality:</span> <span style={{ color: colors.promptQuality, fontWeight: 'bold' }}>{tooltip.record.metrics.promptQuality}</span></div>
              </div>
              <p className="mt-2 pt-2 border-t border-base-100 text-text-secondary italic">
                  "{tooltip.record.evaluationText.substring(0, 80)}..."
              </p>
          </div>
      )}

      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-2 text-xs">
          {Object.entries(colors).map(([key, color]) => (
              <div key={key} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: color }}></div>
                  <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

export default PerformanceChart;
