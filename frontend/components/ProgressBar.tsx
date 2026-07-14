'use client'

import { Box, Typography, LinearProgress } from '@mui/material'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  active: boolean
  current: number
  total: number
  label: string
}

export default function ProgressBar({ active, current, total, label }: ProgressBarProps) {
  if (!active) return null
  const pct = total > 0 ? (current / total) * 100 : 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <Box sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#b388ff' }}>
            {current} / {total}
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={pct} />
      </Box>
    </motion.div>
  )
}
