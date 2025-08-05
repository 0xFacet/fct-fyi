import React from 'react'

interface ProgressBarProps {
  value: number
  max: number
  height?: string
  label?: string
  sublabel?: string
  indicatorColor?: string
  className?: string
}

export function ProgressBar({
  value,
  max,
  height = 'h-8',
  label,
  sublabel,
  indicatorColor = 'bg-facet-blue',
  className = ''
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className={className}>
      {label && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          {label}
        </div>
      )}
      <div className="relative">
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${height} overflow-hidden`}>
          <div 
            className={`${indicatorColor} h-full rounded-full transition-all duration-500 ease-out relative`}
            style={{ width: `${percentage}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
          </div>
        </div>
        {/* Percentage text */}
        {percentage > 5 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 text-white text-sm font-medium px-2"
            style={{ left: `${Math.min(percentage - 2, 90)}%` }}
          >
            {percentage.toFixed(1)}%
          </div>
        )}
      </div>
      {sublabel && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {sublabel}
        </div>
      )}
    </div>
  )
}