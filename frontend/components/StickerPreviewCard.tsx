'use client'

import { Box, Card, CardContent, Typography, Chip } from '@mui/material'
import { motion } from 'framer-motion'
import MovieIcon from '@mui/icons-material/Movie'
import ImageIcon from '@mui/icons-material/Image'
import { UploadedFile } from './FileUploader'

interface StickerPreviewCardProps {
  file: UploadedFile
  index: number
  emoji: string[]
}

export default function StickerPreviewCard({
  file,
  index,
  emoji,
}: StickerPreviewCardProps) {
  const isVideo =
    file.file.type.startsWith('video/') || file.file.type === 'image/gif'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ display: 'flex', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: '#2e2d33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {file.preview && !isVideo ? (
              <img
                src={file.preview}
                alt={file.file.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <MovieIcon sx={{ color: 'primary.main' }} />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: 500,
              }}
            >
              {file.file.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                icon={isVideo ? <MovieIcon sx={{ fontSize: 14 }} /> : <ImageIcon sx={{ fontSize: 14 }} />}
                label={isVideo ? 'Video' : 'Static'}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: isVideo ? 'rgba(239, 184, 255, 0.12)' : 'rgba(163, 201, 255, 0.12)',
                  color: isVideo ? 'secondary.main' : 'primary.main',
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
              <Chip
                label={`${(file.file.size / 1024).toFixed(0)} KB`}
                size="small"
                sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#2e2d33' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {emoji.length > 0 ? emoji.join(' ') : 'No emoji selected'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}
