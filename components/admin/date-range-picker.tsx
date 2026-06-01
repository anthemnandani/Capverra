'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Calendar, RotateCcw, Download } from 'lucide-react'

interface DateRangePickerProps {
  selectedDays: number
  onDaysChange: (days: number) => void
  onRefresh: () => void
  onExport: () => void
  isLoading?: boolean
}

const presets = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
]

export function DateRangePicker({
  selectedDays,
  onDaysChange,
  onRefresh,
  onExport,
  isLoading = false,
}: DateRangePickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-muted/50 border border-border"
    >
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground font-medium">Date Range:</span>
      
      <div className="flex gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.days}
            variant={selectedDays === preset.days ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDaysChange(preset.days)}
            disabled={isLoading}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex-1 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isLoading}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </motion.div>
  )
}
