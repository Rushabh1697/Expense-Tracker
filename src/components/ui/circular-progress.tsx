import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  className?: string
  colorClass?: string
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 10,
  className,
  colorClass = "text-primary"
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn("stroke-current transition-colors", colorClass)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold">{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}
