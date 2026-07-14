'use client'

import { Box, Card, CardContent, Avatar, Typography, Chip } from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import { motion } from 'framer-motion'
import { BotInfo } from '@/lib/api'

interface BotInfoCardProps {
  info: BotInfo
}

export default function BotInfoCard({ info }: BotInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Card>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
          <Avatar
            sx={{
              bgcolor: 'transparent', width: 40, height: 40,
              background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.3), rgba(255, 64, 129, 0.2))',
              border: '1px solid rgba(179, 136, 255, 0.2)',
            }}
          >
            <SmartToyIcon sx={{ color: '#b388ff', fontSize: 20 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {info.first_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              @{info.username}
            </Typography>
          </Box>
          <Chip
            label="✓"
            size="small"
            sx={{
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(105, 240, 174, 0.2), rgba(105, 240, 174, 0.05))',
              color: '#69f0ae',
              border: '1px solid rgba(105, 240, 174, 0.2)',
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22,
            }}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
