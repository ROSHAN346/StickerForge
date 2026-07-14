'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Typography, Container, TextField, Button, Alert, Card, CardContent, IconButton, CircularProgress, Checkbox } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import FileUploader, { UploadedFile } from '@/components/FileUploader'
import EmojiPicker from '@/components/EmojiPicker'
import ProgressBar from '@/components/ProgressBar'
import StickerImage from '@/components/StickerImage'
import { getStickerSetDetail, getStickerSetDetailAsUser, remixStickerPack, remixStickerPackAsUser, StickerSetDetail } from '@/lib/api'
import { getToken, getUserId, getBotInfo, getUserSession, getApiCreds, getLoginMethod, savePack, SavedPack } from '@/lib/storage'
import { haptic, hapticNotify, getTelegramUserId } from '@/lib/telegram'

function RemixContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sourceName, setSourceName] = useState('')
  const [detail, setDetail] = useState<StickerSetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [emojiLists, setEmojiLists] = useState<string[][]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [emojiOverrides, setEmojiOverrides] = useState<Record<number, string>>({})

  useEffect(() => {
    const token = getToken()
    const session = getUserSession()
    const uid = getTelegramUserId() || getUserId()
    if (!uid || (!token && !session)) { router.push('/'); return }
    const name = searchParams.get('pack')
    if (!name) { router.push('/dashboard'); return }
    setSourceName(name)
    fetchDetail(name)
  }, [router, searchParams])

  useEffect(() => {
    setEmojiLists(files.map((_, i) => emojiLists[i] || []))
  }, [files])

  const isUserMode = getLoginMethod() === 'user'
  const token = getToken()
  const session = getUserSession()
  const creds = getApiCreds()

  const fetchDetail = async (name: string) => {
    setLoading(true)
    setError('')
    try {
      let d: StickerSetDetail
      if (isUserMode && session && creds) {
        d = await getStickerSetDetailAsUser(session, creds.apiId, creds.apiHash, name)
      } else {
        const t = getToken()
        if (!t) { router.push('/'); return }
        d = await getStickerSetDetail(t, name)
      }
      setDetail(d)
      const all = new Set<number>()
      d.stickers.forEach((_, i) => all.add(i))
      setSelected(all)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pack')
    } finally {
      setLoading(false)
    }
  }

  const toggleSticker = (index: number) => {
    haptic('light')
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleEmojiOverride = (index: number, emoji: string) => {
    setEmojiOverrides((prev) => ({ ...prev, [index]: emoji }))
  }

  const handleRemix = async () => {
    if (!newTitle.trim()) { setSubmitError('Give your new pack a name! 😅'); hapticNotify('error'); return }
    if (selected.size === 0 && files.length === 0) { setSubmitError('Select at least one sticker or upload a file'); hapticNotify('error'); return }
    if (emojiLists.some((e) => e.length === 0)) { setSubmitError('Each new sticker needs at least one emoji'); hapticNotify('error'); return }

    const userId = getTelegramUserId() || getUserId()
    const botInfo = getBotInfo()
    if (!userId) { router.push('/'); return }

    setSubmitting(true)
    setSubmitError('')
    try {
      const selectedArr = Array.from(selected).map((idx) => ({
        index: idx,
        emoji: emojiOverrides[idx] || detail?.stickers[idx]?.emoji || '😀',
      }))

      let result
      if (isUserMode && session && creds) {
        result = await remixStickerPackAsUser(
          session, creds.apiId, creds.apiHash, sourceName, newTitle.trim(),
          selectedArr, files.map((f) => f.file), emojiLists
        )
      } else if (token && botInfo) {
        result = await remixStickerPack(
          token, userId, sourceName, newTitle.trim(), botInfo.username,
          selectedArr, files.map((f) => f.file), emojiLists
        )
      } else { router.push('/'); return }

      savePack({
        name: result.pack_name,
        title: newTitle.trim(),
        link: result.pack_link,
        botUsername: isUserMode ? 'user' : (botInfo?.username || 'user'),
        stickerCount: selected.size + files.length,
        createdAt: Date.now(),
        userId: userId || undefined,
      })
      hapticNotify('success')
      router.push(`/result?link=${encodeURIComponent(result.pack_link)}&name=${encodeURIComponent(result.pack_name)}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to remix pack'
      setSubmitError(msg)
      hapticNotify('error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCount = selected.size

  return (
    <Container maxWidth="lg" sx={{ pt: 3, pb: 8 }}>
      <PageTransition>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* LEFT SIDEBAR */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, position: { md: 'sticky' }, top: { md: 24 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              <span className="gradient-text">Remix Pack</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.85rem' }}>
              Select stickers from any pack, change their emoji, add your own, and publish as a brand new pack.
            </Typography>
            <Card sx={{ border: '1px solid rgba(179, 136, 255, 0.08)', mb: 2 }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>✅</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>Select stickers</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>Check/uncheck which stickers to include</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>😊</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>Edit emoji</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>Click emoji on any sticker to change it</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>📤</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>Add your own</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>Upload new stickers alongside selected ones</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(105, 240, 174, 0.2), rgba(64, 196, 255, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>🚀</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>Publish as new</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>Creates a brand new pack with your bot</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* RIGHT MAIN */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Top back bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton
                onClick={() => { haptic('light'); router.back() }}
                sx={{ color: 'text.secondary', border: '1px solid rgba(179, 136, 255, 0.15)', borderRadius: '12px', '&:hover': { color: '#b388ff', borderColor: 'rgba(179, 136, 255, 0.35)' } }}
              >
                <ArrowBackIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Back</Typography>
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={40} sx={{ color: '#b388ff' }} />
              </Box>
            )}

            {error && !loading && (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {detail && !loading && (
              <>
                {/* Source pack info */}
                <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.12)' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.25), rgba(255, 64, 129, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AutoAwesomeMotionIcon sx={{ color: '#b388ff', fontSize: 22 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{detail.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {detail.sticker_count} stickers · {selectedCount} selected
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => { haptic('light'); const all = new Set<number>(); detail.stickers.forEach((_, i) => all.add(i)); setSelected(all) }} sx={{ fontSize: '0.72rem', borderColor: 'rgba(179, 136, 255, 0.2)' }}>Select All</Button>
                      <Button size="small" variant="outlined" onClick={() => { haptic('light'); setSelected(new Set()) }} sx={{ fontSize: '0.72rem', borderColor: 'rgba(179, 136, 255, 0.2)' }}>Clear</Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* New pack name */}
                <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>New Pack Name ✏️</Typography>
                    <TextField
                      fullWidth
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="My Remixed Pack"
                      disabled={submitting}
                      slotProps={{ htmlInput: { maxLength: 64 } }}
                    />
                  </CardContent>
                </Card>

                {/* Sticker selection grid */}
                <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Select Stickers ({selectedCount}/{detail.sticker_count})</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5 }}>
                      {detail.stickers.map((sticker, i) => {
                        const isSelected = selected.has(i)
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                          >
                            <Box
                              onClick={() => toggleSticker(i)}
                              sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                bgcolor: isSelected ? 'rgba(179, 136, 255, 0.08)' : 'rgba(21, 19, 31, 0.5)',
                                border: `1px solid ${isSelected ? 'rgba(179, 136, 255, 0.3)' : 'rgba(179, 136, 255, 0.06)'}`,
                                borderRadius: '14px', p: 1, gap: 0.5,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: isSelected ? 1 : 0.5,
                                '&:hover': { borderColor: 'rgba(179, 136, 255, 0.25)' },
                              }}
                            >
                              <Box sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <StickerImage
                                  filePath={sticker.file_path}
                                  isVideo={sticker.is_video}
                                  isAnimated={sticker.is_animated}
                                  token={token}
                                  packName={sourceName}
                                  isUserMode={isUserMode}
                                  alt={`sticker ${i}`}
                                  sx={{ maxWidth: '100%', maxHeight: '56px', borderRadius: '8px' }}
                                />
                                <Checkbox
                                  checked={isSelected}
                                  size="small"
                                  sx={{
                                    position: 'absolute', top: -8, right: -8, padding: '2px',
                                    color: isSelected ? '#b388ff' : 'text.disabled',
                                    '&.Mui-checked': { color: '#b388ff' },
                                  }}
                                />
                              </Box>
                              <Box
                                onClick={(e) => { e.stopPropagation(); haptic('light') }}
                                sx={{ width: '100%' }}
                              >
                                <EmojiPicker
                                  selected={emojiOverrides[i] ? [emojiOverrides[i]] : (sticker.emoji ? [sticker.emoji] : [])}
                                  onChange={(emojis) => handleEmojiOverride(i, emojis[0] || '😀')}
                                  index={i}
                                />
                              </Box>
                            </Box>
                          </motion.div>
                        )
                      })}
                    </Box>
                  </CardContent>
                </Card>

                {/* Add new stickers */}
                <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Add Your Own Stickers 📤</Typography>
                    <FileUploader files={files} onFilesChange={setFiles} />

                    {files.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600, fontSize: '0.72rem' }}>Assign emoji to new stickers:</Typography>
                        <AnimatePresence>
                          {files.map((file, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: '12px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, color: '#b388ff' }}>{i + 1}</Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>{file.file.name}</Typography>
                                  <EmojiPicker selected={emojiLists[i] || []} onChange={(emojis) => { const n = [...emojiLists]; n[i] = emojis; setEmojiLists(n) }} index={i} />
                                </Box>
                              </Box>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

                {submitting && (
                  <Box sx={{ mb: 2 }}>
                    <ProgressBar active={submitting} current={selectedCount + files.length} total={selectedCount + files.length} label="Remixing your pack... 🔄" />
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.72rem' }}>
                      Creating a new pack with {selectedCount} selected + {files.length} new stickers. This may take a moment.
                    </Typography>
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleRemix}
                  disabled={submitting || !newTitle.trim() || (selected.size === 0 && files.length === 0)}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                >
                  {submitting ? 'Remixing...' : `Remix & Publish 🚀 (${selectedCount + files.length} stickers)`}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </PageTransition>
    </Container>
  )
}

export default function RemixPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress sx={{ color: '#b388ff' }} /></Box>}>
      <RemixContent />
    </Suspense>
  )
}
