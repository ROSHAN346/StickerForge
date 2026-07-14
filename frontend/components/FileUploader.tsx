'use client'

import { useCallback, useState, DragEvent as ReactDragEvent } from 'react'
import { Box, Typography, IconButton, alpha } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import { motion, AnimatePresence } from 'framer-motion'
import { haptic, hapticNotify } from '@/lib/telegram'

export interface UploadedFile {
  file: File
  preview: string
}

interface FileUploaderProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
}

const ACCEPTED_TYPES = 'image/png,image/webp,image/jpeg,image/gif,video/mp4,video/webm,video/quicktime,.png,.webp,.jpg,.jpeg,.gif,.mp4,.webm,.mov'

export default function FileUploader({ files, onFilesChange }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return
      const valid: UploadedFile[] = []
      Array.from(newFiles).forEach((file) => {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        const isGif = file.type === 'image/gif'
        if (isImage || isVideo || isGif) {
          const preview = isVideo ? '' : URL.createObjectURL(file)
          valid.push({ file, preview })
        }
      })
      if (valid.length === 0) { hapticNotify('error'); return }
      haptic('medium')
      onFilesChange([...files, ...valid])
    },
    [files, onFilesChange],
  )

  const handleDrop = (e: ReactDragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    haptic('light')
    const newFiles = [...files]
    if (newFiles[index].preview) URL.revokeObjectURL(newFiles[index].preview)
    newFiles.splice(index, 1)
    onFilesChange(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isVideo = (file: File) => file.type.startsWith('video/') || file.type === 'image/gif'

  return (
    <Box sx={{ width: '100%' }}>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '10px', paddingTop: '48px', paddingBottom: '48px', paddingLeft: '24px', paddingRight: '24px',
          borderRadius: '24px', border: '2px dashed',
          borderColor: dragOver ? '#b388ff' : 'rgba(179, 136, 255, 0.15)',
          backgroundColor: dragOver ? 'rgba(179, 136, 255, 0.06)' : 'rgba(21, 19, 31, 0.4)',
          backdropFilter: 'blur(10px)', cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <input type="file" hidden multiple accept={ACCEPTED_TYPES} onChange={(e) => handleFiles(e.target.files)} />
        <motion.div animate={{ scale: dragOver ? 1.2 : 1, y: dragOver ? -6 : 0 }} transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}>
          <CloudUploadIcon sx={{ fontSize: 52, color: dragOver ? '#b388ff' : '#5a5070' }} />
        </motion.div>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 500 }}>
          Drag & drop or <span style={{ color: '#b388ff', fontWeight: 700 }}>browse</span>
        </Typography>
        <Typography variant="caption" color="text.disabled">
          PNG · WebP · JPG · GIF · MP4 · WebM — up to 50 files 🎨
        </Typography>
      </label>

      <AnimatePresence>
        {files.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {files.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Box
                  sx={{
                    position: 'relative', width: 96, height: 96, borderRadius: '20px', overflow: 'hidden',
                    border: '1px solid rgba(179, 136, 255, 0.12)', bgcolor: 'rgba(21, 19, 31, 0.6)',
                    backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {f.preview && !isVideo(f.file) ? (
                    <img src={f.preview} alt={f.file.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, p: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>
                        {isVideo(f.file) ? '🎬 VIDEO' : '🖼️ IMG'}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.2 }}>
                        {f.file.name.slice(0, 12)}
                      </Typography>
                    </Box>
                  )}
                  <IconButton
                    size="small"
                    onClick={(e) => { e.preventDefault(); removeFile(i) }}
                    sx={{
                      position: 'absolute', top: 4, right: 4,
                      bgcolor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
                      '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.4)' }, width: 24, height: 24,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', px: 0.5, py: 0.25 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#a89eb8' }}>
                      {formatFileSize(f.file.size)}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>
        )}
      </AnimatePresence>
    </Box>
  )
}
