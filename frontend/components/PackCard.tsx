'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import StickersIcon from '@mui/icons-material/AutoAwesomeMotion'
import SendIcon from '@mui/icons-material/Send'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import { motion } from 'framer-motion'
import { SavedPack } from '@/lib/storage'
import { haptic } from '@/lib/telegram'

interface PackCardProps {
  pack: SavedPack
  index: number
  onDelete?: (pack: SavedPack) => void
  onSend?: (pack: SavedPack) => void
  onView?: (pack: SavedPack) => void
  onEdit?: (pack: SavedPack) => void
  onEditFull?: (pack: SavedPack) => void
  onRemix?: (pack: SavedPack) => void
}

export default function PackCard({ pack, index, onDelete, onSend, onView, onEdit, onEditFull, onRemix }: PackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Card sx={{ mb: 1 }}>
        <CardContent sx={{ py: 1.25, px: 2, '&:last-child': { pb: 1.25 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <StickersIcon sx={{ color: '#b388ff', fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.82rem' }}>
                {pack.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                {pack.stickerCount} stickers · @{pack.botUsername}
              </Typography>
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
              {onSend && (
                <Tooltip title="Send stickers" placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); haptic('light'); onSend(pack) }}
                    sx={{ color: '#69f0ae', '&:hover': { backgroundColor: 'rgba(105, 240, 174, 0.08)' } }}
                  >
                    <SendIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {onView && (
                <Tooltip title="View pack" placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); haptic('light'); onView(pack) }}
                    sx={{ color: '#82eaff', '&:hover': { backgroundColor: 'rgba(130, 234, 255, 0.08)' } }}
                  >
                    <VisibilityIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {onEditFull && (
                <Tooltip title="Full edit (delete, emoji, reorder)" placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); haptic('light'); onEditFull(pack) }}
                    sx={{ color: '#69f0ae', '&:hover': { backgroundColor: 'rgba(105, 240, 174, 0.08)' } }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && !onEditFull && (
                <Tooltip title="Add stickers" placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); haptic('light'); onEdit(pack) }}
                    sx={{ color: '#b388ff', '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.08)' } }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {onRemix && (
                <Tooltip title="Remix — create new pack from this" placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); haptic('light'); onRemix(pack) }}
                    sx={{ color: '#ff4081', '&:hover': { backgroundColor: 'rgba(255, 64, 129, 0.08)' } }}
                  >
                    <AutoFixHighIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Delete" placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); haptic('medium'); onDelete(pack) }}
                    sx={{ color: 'text.disabled', '&:hover': { color: '#ff5252', backgroundColor: 'rgba(255, 82, 82, 0.08)' } }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}
