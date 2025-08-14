

import React, { useState } from 'react';
import { PredictiveVisualizationSchema, PredictiveTrajectoryPoint } from '../types';

interface ChartProps {
  schema: PredictiveVisualizationSchema;
}

interface TooltipData {
  x: number;
  y: number;
  cycle: number;
  debt: number;
  compliance: number;
}

const ArchitecturalPredictionChart: React.FC<ChartProps> = ({ schema }) => {
  const { trajectory, summary } = schema;
  
  if (!trajectory || trajectory.length === 0) {
    return <p className="text-sm text-text-secondary">{summary || "No trajectory data available."}</p>;
  }

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const width = 500;
  const height = 200;
  const padding = 40;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding;

  const maxScore = 5;
  const dataPoints = trajectory.sort((a,b) => a.cycle - b.cycle);
  const count = dataPoints.length;

  const getX = (index: number) => padding + (count > 1 ? (index / (count - 1)) * innerWidth : innerWidth / 2);
  const getComplianceY = (score: number) => height - padding - (score / maxScore) * innerHeight;
  const getDebtY = (score: number) => height - padding - (score / 1.0) * innerHeight; // Debt is 0.0 to 1.0

  const colors = {
    predictedCompliance: '#34d399', // green-400
    anticipatedDebt: '#f87171' // red-400
  };

  const createPath = (key: 'predictedCompliance' | 'anticipatedDebt') => {
    if (count === 0) return "";
    const getY = key === 'predictedCompliance' ? getComplianceY : getDebtY;
    let path = `M ${getX(0)} ${getY(dataPoints[0][key])}`;
    for (let i = 1; i < count; i++) {
      path += ` L ${getX(i)} ${getY(dataPoints[i][key])}`;
    }
    return path;
  };

  const handleMouseEnter = (point: PredictiveTrajectoryPoint, index: number) => {
    setTooltip({
      x: getX(index),
      y: getComplianceY(point.predictedCompliance),
      cycle: point.cycle,
      debt: point.anticipatedDebt,
      compliance: point.predictedCompliance
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="w-full relative">
      <p className="text-xs text-center text-text-secondary mb-2">{summary}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-Axis Labels (Compliance) */}
        {[...Array(maxScore + 1)].map((_, i) => (
          <g key={`comp-${i}`}>
            <text x={padding - 10} y={getComplianceY(i) + 4} textAnchor="end" fontSize="10" fill={colors.predictedCompliance}>
              {i}
            </text>
          </g>
        ))}
         {/* Y-Axis Labels (Debt) */}
        {[...Array(5)].map((_, i) => (
             <g key={`debt-${i}`}>
                <text x={width - padding + 10} y={getDebtY(i*0.25) + 4} textAnchor="start" fontSize="10" fill={colors.anticipatedDebt}>
                    {(i*25)}%
                </text>
            </g>
        ))}
        {/* Grid lines */}
        {[...Array(5)].map((_, i) => (
             <line
              key={`grid-${i}`}
              x1={padding}
              y1={getDebtY(i*0.25)}
              x2={width - padding}
              y2={getDebtY(i*0.25)}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
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
            strokeDasharray="4 4"
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
                cy={(key === 'predictedCompliance' ? getComplianceY : getDebtY)(record[key as keyof typeof colors])}
                r="4"
                fill={colors[key as keyof typeof colors]}
              />
            ))}
            <text x={getX(index)} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#94a3b8">
                C+{record.cycle}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Tooltip */}
      {tooltip && (
          <div 
              className="absolute p-3 bg-base-100 text-text-primary rounded-lg shadow-lg text-xs w-48 pointer-events-none transition-opacity duration-200 animate-fade-in-up"
              style={{ 
                  left: tooltip.x, 
                  top: tooltip.y,
                  transform: `translate(-50%, -110%)`,
                  opacity: 1
              }}
          >
              <p className="font-bold text-text-secondary mb-2">
                  Forecast for Cycle +{tooltip.cycle}
              </p>
              <div className="space-y-1">
                  <div className="flex justify-between"><span>Compliance:</span> <span style={{ color: colors.predictedCompliance, fontWeight: 'bold' }}>{tooltip.compliance.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Anticipated Debt:</span> <span style={{ color: colors.anticipatedDebt, fontWeight: 'bold' }}>{(tooltip.debt * 100).toFixed(0)}%</span></div>
              </div>
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

export default ArchitecturalPredictionChart;
