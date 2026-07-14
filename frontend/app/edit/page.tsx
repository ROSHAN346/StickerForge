'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Typography, Container, TextField, Button, Alert, Card, CardContent, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import FileUploader, { UploadedFile } from '@/components/FileUploader'
import EmojiPicker from '@/components/EmojiPicker'
import ProgressBar from '@/components/ProgressBar'
import StickerImage from '@/components/StickerImage'
import { getStickerSetDetail, getStickerSetDetailAsUser, addStickersToPack, addStickersToPackAsUser, deleteStickerFromPack, deleteStickerFromPackAsUser, updateStickerEmoji, updateStickerEmojiAsUser, reorderSticker, reorderStickerAsUser, deleteStickerPack, deleteStickerPackAsUser, StickerSetDetail } from '@/lib/api'
import { getToken, getUserId, getBotInfo, getUserSession, getApiCreds, getLoginMethod, updatePackCount, SavedPack, getPacks, savePack, deletePack } from '@/lib/storage'
import { haptic, hapticNotify, getTelegramUserId } from '@/lib/telegram'
import { openTelegramLink, copyToClipboard } from '@/lib/links'

function EditContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [packName, setPackName] = useState('')
  const [detail, setDetail] = useState<StickerSetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [emojiLists, setEmojiLists] = useState<string[][]>([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deletePackOpen, setDeletePackOpen] = useState(false)
  const [deletePackLoading, setDeletePackLoading] = useState(false)
  const [editingEmoji, setEditingEmoji] = useState<number | null>(null)
  const [emojiDraft, setEmojiDraft] = useState<string[]>([])

  useEffect(() => {
    const token = getToken()
    const session = getUserSession()
    const uid = getTelegramUserId() || getUserId()
    if (!uid || (!token && !session)) { router.push('/'); return }
    const name = searchParams.get('pack')
    if (!name) { router.push('/dashboard'); return }
    setPackName(name)
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pack')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSticker = async (stickerFileId: string) => {
    haptic('medium')
    setActionLoading(stickerFileId)
    try {
      if (isUserMode && session && creds) {
        await deleteStickerFromPackAsUser(session, creds.apiId, creds.apiHash, Number(stickerFileId))
      } else if (token) {
        await deleteStickerFromPack(token, stickerFileId)
      } else { return }
      hapticNotify('success')
      await fetchDetail(packName)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete sticker')
      hapticNotify('error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveEmoji = async (stickerFileId: string) => {
    if (editingEmoji === null) return
    haptic('medium')
    setActionLoading(stickerFileId)
    try {
      const emoji = emojiDraft.length > 0 ? emojiDraft[0] : '😀'
      if (isUserMode && session && creds) {
        await updateStickerEmojiAsUser(session, creds.apiId, creds.apiHash, Number(stickerFileId), emoji)
      } else if (token) {
        await updateStickerEmoji(token, stickerFileId, emojiDraft.length > 0 ? emojiDraft : ['😀'])
      } else { return }
      hapticNotify('success')
      setEditingEmoji(null)
      await fetchDetail(packName)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update emoji')
      hapticNotify('error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReorder = async (stickerFileId: string, direction: 'up' | 'down', currentIndex: number) => {
    if (!detail) return
    const newPos = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newPos < 0 || newPos >= detail.stickers.length) return
    haptic('light')
    setActionLoading(stickerFileId)
    try {
      if (isUserMode && session && creds) {
        await reorderStickerAsUser(session, creds.apiId, creds.apiHash, Number(stickerFileId), newPos)
      } else if (token) {
        await reorderSticker(token, stickerFileId, newPos)
      } else { return }
      hapticNotify('success')
      await fetchDetail(packName)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reorder')
      hapticNotify('error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddStickers = async () => {
    if (files.length === 0) { setAddError('Upload at least one file'); hapticNotify('error'); return }
    if (emojiLists.some((e) => e.length === 0)) { setAddError('Each sticker needs at least one emoji'); hapticNotify('error'); return }

    const userId = getTelegramUserId() || getUserId()
    if (!userId) { router.push('/'); return }

    setAdding(true)
    setAddError('')
    try {
      if (isUserMode && session && creds) {
        await addStickersToPackAsUser(session, creds.apiId, creds.apiHash, packName, files.map((f) => f.file), emojiLists)
      } else if (token) {
        await addStickersToPack(token, userId, packName, files.map((f) => f.file), emojiLists)
      } else { router.push('/'); return }
      updatePackCount(packName, files.length)
      hapticNotify('success')
      await fetchDetail(packName)
      setFiles([])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to add stickers'
      setAddError(msg)
      hapticNotify('error')
    } finally {
      setAdding(false)
    }
  }

  const handleDeletePack = async () => {
    setDeletePackLoading(true)
    try {
      if (isUserMode && session && creds) {
        await deleteStickerPackAsUser(session, creds.apiId, creds.apiHash, packName)
      } else if (token) {
        await deleteStickerPack(token, packName)
      } else { return }
      deletePack(packName)
      hapticNotify('success')
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete pack')
      hapticNotify('error')
    } finally {
      setDeletePackLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 3, pb: 8 }}>
      <PageTransition>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* LEFT SIDEBAR */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, position: { md: 'sticky' }, top: { md: 24 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              <span className="gradient-text">Edit Pack</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.85rem' }}>
              Full control: delete stickers, change emoji, reorder, or add new ones.
            </Typography>
            <Card sx={{ border: '1px solid rgba(179, 136, 255, 0.08)', mb: 2 }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>🗑️</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>Delete sticker</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>Remove individual stickers from the pack</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>😊</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>Change emoji</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>Click emoji on any sticker to edit it</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>⬆️</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>Reorder</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>Move stickers up or down in the pack</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>📤</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>Add new</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>Upload new stickers to the pack</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ border: '1px solid rgba(255, 82, 82, 0.1)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#ff5252', fontSize: '0.8rem' }}>
                  ⚠️ Danger Zone
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5, mb: 1.5 }}>
                  Delete the entire pack from Telegram. This cannot be undone.
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<DeleteForeverIcon sx={{ fontSize: 16 }} />}
                  onClick={() => { haptic('medium'); setDeletePackOpen(true) }}
                  sx={{ borderColor: 'rgba(255, 82, 82, 0.2)', color: '#ff5252', '&:hover': { borderColor: '#ff5252', bgcolor: 'rgba(255, 82, 82, 0.05)' } }}
                >
                  Delete Entire Pack
                </Button>
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
                {/* Pack info header */}
                <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.12)' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.25), rgba(255, 64, 129, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <SmartToyIcon sx={{ color: '#b388ff', fontSize: 22 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{detail.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {detail.sticker_count} stickers · {detail.name}
                        </Typography>
                      </Box>
                      <Box
                        onClick={() => { haptic('light'); copyToClipboard(`https://t.me/addstickers/${detail.name}`) }}
                        sx={{ color: 'text.disabled', cursor: 'pointer', '&:hover': { color: '#b388ff' } }}
                      >
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>t.me/addstickers/{detail.name}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Sticker grid */}
                <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Stickers ({detail.sticker_count})</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1.5 }}>
                      {detail.stickers.map((sticker, i) => {
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                          >
                            <Box
                              sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                bgcolor: 'rgba(21, 19, 31, 0.5)',
                                border: '1px solid rgba(179, 136, 255, 0.08)',
                                borderRadius: '14px', p: 1, gap: 0.5,
                              }}
                            >
                              <StickerImage
                                filePath={sticker.file_path}
                                isVideo={sticker.is_video}
                                isAnimated={sticker.is_animated}
                                token={token}
                                packName={packName}
                                isUserMode={isUserMode}
                                alt={`sticker ${i}`}
                                sx={{ maxWidth: '100%', maxHeight: '56px', borderRadius: '8px' }}
                              />

                              {/* Emoji - clickable to edit */}
                              {editingEmoji === i ? (
                                <Box sx={{ width: '100%' }}>
                                  <EmojiPicker
                                    selected={emojiDraft}
                                    onChange={setEmojiDraft}
                                    index={i}
                                  />
                                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, justifyContent: 'center' }}>
                                    <IconButton size="small" onClick={() => handleSaveEmoji(sticker.file_id)} disabled={actionLoading === sticker.file_id} sx={{ color: '#69f0ae' }}>
                                      {actionLoading === sticker.file_id ? <CircularProgress size={14} /> : <CheckCircleIcon sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                    <IconButton size="small" onClick={() => { setEditingEmoji(null); setEmojiDraft([]) }} sx={{ color: '#ff5252' }}>
                                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Box>
                                </Box>
                              ) : (
                                <Box
                                  onClick={() => { haptic('light'); setEditingEmoji(i); setEmojiDraft(sticker.emoji ? [sticker.emoji] : []) }}
                                  sx={{ cursor: 'pointer', fontSize: '0.9rem', '&:hover': { opacity: 0.7 } }}
                                >
                                  {sticker.emoji || '—'}
                                </Box>
                              )}

                              {/* Action buttons */}
                              {editingEmoji !== i && (
                                <Box sx={{ display: 'flex', gap: 0.25, mt: 0.25 }}>
                                  <IconButton size="small" onClick={() => handleReorder(sticker.file_id, 'up', i)} disabled={i === 0 || actionLoading === sticker.file_id} sx={{ color: 'text.disabled', '&:hover': { color: '#82eaff' }, padding: '2px' }}>
                                    <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleReorder(sticker.file_id, 'down', i)} disabled={i === detail.stickers.length - 1 || actionLoading === sticker.file_id} sx={{ color: 'text.disabled', '&:hover': { color: '#82eaff' }, padding: '2px' }}>
                                    <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleDeleteSticker(sticker.file_id)} disabled={actionLoading === sticker.file_id} sx={{ color: 'text.disabled', '&:hover': { color: '#ff5252' }, padding: '2px' }}>
                                    {actionLoading === sticker.file_id ? <CircularProgress size={14} /> : <DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                                  </IconButton>
                                </Box>
                              )}
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Add New Stickers 📤</Typography>
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

                    {addError && <Alert severity="error" sx={{ mb: 2, mt: 1.5 }}>{addError}</Alert>}

                    {adding && (
                      <Box sx={{ mb: 2, mt: 1.5 }}>
                        <ProgressBar active={adding} current={files.length} total={files.length} label="Adding stickers..." />
                      </Box>
                    )}

                    <Button fullWidth variant="contained" size="large" onClick={handleAddStickers} disabled={adding || files.length === 0} sx={{ py: 1.5, fontSize: '1rem' }}>
                      {adding ? 'Adding...' : `Add ${files.length} sticker${files.length !== 1 ? 's' : ''} to pack`}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </Box>
        </Box>
      </PageTransition>

      {/* Delete pack confirmation */}
      <Dialog open={deletePackOpen} onClose={() => setDeletePackOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { bgcolor: '#1a1721', border: '1px solid rgba(255, 82, 82, 0.15)', borderRadius: '20px' } } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '16px', background: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.15)', mb: 1.5 }}>
            <DeleteForeverIcon sx={{ color: '#ff5252', fontSize: 24 }} />
          </Box>
          <Typography component="div" variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>Delete Entire Pack?</Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', mb: 2.5 }}>
            This will permanently delete <strong style={{ color: '#f5f0ff' }}>{detail?.title}</strong> from Telegram. This cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button fullWidth variant="outlined" onClick={() => { haptic('light'); setDeletePackOpen(false) }} sx={{ borderColor: 'rgba(179, 136, 255, 0.2)', '&:hover': { borderColor: 'rgba(179, 136, 255, 0.4)' } }}>Cancel</Button>
            <Button fullWidth variant="contained" onClick={handleDeletePack} disabled={deletePackLoading} sx={{ bgcolor: '#ff5252', '&:hover': { bgcolor: '#ff6b6b' }, fontWeight: 700 }}>
              {deletePackLoading ? <CircularProgress size={22} sx={{ color: 'inherit' }} /> : 'Delete Forever'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default function EditPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress sx={{ color: '#b388ff' }} /></Box>}>
      <EditContent />
    </Suspense>
  )
}
