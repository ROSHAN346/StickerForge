'use client'

import { useEffect, useState } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { getUserSession, getApiCreds } from '@/lib/storage'

type BatchEntry = { url: string; mime: string } | null

const batchFetchInProgress: Record<string, Promise<BatchEntry[]>> = {}

async function fetchBatch(packName: string): Promise<BatchEntry[]> {
  if (batchFetchInProgress[packName] != null) return batchFetchInProgress[packName]

  const session = getUserSession()
  const creds = getApiCreds()
  if (!session || !creds) return []

  const promise = fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/api/user-stickers/sticker-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_string: session,
      api_id: creds.apiId,
      api_hash: creds.apiHash,
      pack_name: packName,
    }),
  })
    .then((r) => {
      if (!r.ok) throw new Error('Failed')
      return r.json()
    })
    .then((json: { stickers: ({ data: string; mime: string } | null)[] }) => {
      const entries: BatchEntry[] = json.stickers.map((s) => {
        if (!s) return null
        const byteChars = atob(s.data)
        const bytes = new Uint8Array(byteChars.length)
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
        const blob = new Blob([bytes], { type: s.mime })
        return { url: URL.createObjectURL(blob), mime: s.mime }
      })
      delete batchFetchInProgress[packName]
      return entries
    })
    .catch(() => {
      delete batchFetchInProgress[packName]
      return []
    })

  batchFetchInProgress[packName] = promise
  return promise
}

function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/') || mime === 'image/gif'
}

function isVideoPath(path: string): boolean {
  const lower = path.toLowerCase()
  return lower.endsWith('.webm') || lower.endsWith('.mp4') || lower.endsWith('.gif')
}

interface StickerImageProps {
  filePath: string
  isVideo: boolean
  isAnimated: boolean
  token: string | null
  packName: string
  isUserMode: boolean
  alt?: string
  sx?: object
}

export default function StickerImage({ filePath, isVideo, isAnimated, token, packName, isUserMode, alt, sx }: StickerImageProps) {
  const [blobEntry, setBlobEntry] = useState<BatchEntry>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isUserMode || !filePath || !filePath.startsWith('user_sticker:')) {
      setLoading(false)
      return
    }

    const idx = parseInt(filePath.split(':')[1], 10)
    if (isNaN(idx)) { setError(true); return }

    let cancelled = false
    setLoading(true)

    fetchBatch(packName).then((entries) => {
      if (cancelled) return
      if (entries[idx] !== undefined) {
        setBlobEntry(entries[idx])
      } else {
        setError(true)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
      if (blobEntry?.url) {
        URL.revokeObjectURL(blobEntry.url)
      }
    }
  }, [filePath, isUserMode, packName])

  const botApiUrl = filePath && token && !filePath.startsWith('user_sticker:')
    ? `https://api.telegram.org/file/bot${token}/${filePath}`
    : ''

  const imgUrl = isUserMode ? (blobEntry?.url || null) : botApiUrl

  const actualIsVideo = isUserMode
    ? (blobEntry ? isVideoMime(blobEntry.mime) : isVideo)
    : (filePath ? isVideoPath(filePath) : isVideo)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...sx }}>
        <CircularProgress size={16} sx={{ color: 'rgba(179, 136, 255, 0.4)' }} />
      </Box>
    )
  }

  if (!imgUrl || error) {
    return <Typography sx={{ fontSize: '1.2rem' }}>❓</Typography>
  }

  if (actualIsVideo) {
    return (
      <Box
        component="video"
        src={imgUrl}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setError(true)}
        sx={sx}
      />
    )
  }

  return (
    <Box
      component="img"
      src={imgUrl}
      alt={alt || 'sticker'}
      onError={() => setError(true)}
      sx={sx}
    />
  )
}
