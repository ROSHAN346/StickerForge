'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, Container, TextField, Button, Alert, Card, CardContent, IconButton, Collapse } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import FileUploader, { UploadedFile } from '@/components/FileUploader'
import EmojiPicker from '@/components/EmojiPicker'
import ProgressBar from '@/components/ProgressBar'
import { createStickerPack, createStickerPackAsUser } from '@/lib/api'
import { getToken, getBotInfo, getUserId, savePack, BotInfoStorage, setUserId, getUserSession, getApiCreds, getLoginMethod } from '@/lib/storage'
import { haptic, hapticNotify, getTelegramUserId } from '@/lib/telegram'
import { copyToClipboard } from '@/lib/links'

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [emojiLists, setEmojiLists] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [botNotStarted, setBotNotStarted] = useState(false)
  const [botInfoState, setBotInfoState] = useState<BotInfoStorage | null>(null)
  const [copiedBot, setCopiedBot] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState(false)
  const [idInput, setIdInput] = useState('')
  const [hiddenId, setHiddenId] = useState(true)

  useEffect(() => {
    const token = getToken()
    const session = getUserSession()
    const userId = getTelegramUserId() || getUserId()
    const bi = getBotInfo()
    if (!userId || (!token && !session)) router.push('/')
    setCurrentUserId(userId)
    setBotInfoState(bi)
    setEmojiLists(files.map(() => []))
  }, [router])

  useEffect(() => {
    setEmojiLists((prev) => files.map((_, i) => prev[i] || []))
  }, [files])

  const handleEditId = () => {
    haptic('light')
    setIdInput(String(currentUserId || ''))
    setEditingId(true)
  }

  const handleSaveId = () => {
    const trimmed = idInput.trim()
    if (!trimmed || isNaN(Number(trimmed))) {
      hapticNotify('error')
      return
    }
    haptic('medium')
    hapticNotify('success')
    setUserId(Number(trimmed))
    setCurrentUserId(Number(trimmed))
    setEditingId(false)
  }

  const handleCancelId = () => {
    haptic('light')
    setEditingId(false)
  }

  const handleSwitchBot = () => {
    haptic('medium')
    router.push('/')
  }

  const handleCreate = async () => {
    if (!title.trim()) { setError('Give your pack a name first! 😅'); hapticNotify('error'); return }
    if (files.length === 0) { setError('Upload at least one file come on 🙄'); hapticNotify('error'); return }
    if (emojiLists.some((e) => e.length === 0)) { setError('Each sticker needs at least one emoji 🙏'); hapticNotify('error'); return }

    const loginMethod = getLoginMethod()
    const userId = getTelegramUserId() || getUserId()

    setLoading(true); setError(''); setBotNotStarted(false)
    try {
      let result
      let botUsername = 'user'

      if (loginMethod === 'user') {
        const session = getUserSession()
        const creds = getApiCreds()
        if (!session || !creds) { router.push('/'); return }
        result = await createStickerPackAsUser(session, creds.apiId, creds.apiHash, title.trim(), files.map((f) => f.file), emojiLists)
      } else {
        const token = getToken()
        const botInfo = getBotInfo()
        if (!token || !userId || !botInfo) { router.push('/'); return }
        setBotInfoState(botInfo)
        botUsername = botInfo.username
        result = await createStickerPack(token, userId, title.trim(), botInfo.username, files.map((f) => f.file), emojiLists)
      }

      savePack({ name: result.pack_name, title: title.trim(), link: result.pack_link, botUsername, stickerCount: files.length, createdAt: Date.now(), userId: userId || undefined })
      hapticNotify('success')
      router.push(`/result?link=${encodeURIComponent(result.pack_link)}&name=${encodeURIComponent(result.pack_name)}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something broke 😵'
      setError(msg)
      if (msg.toLowerCase().includes('user not found') || msg.toLowerCase().includes('/start')) {
        setBotNotStarted(true)
      }
      hapticNotify('error')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { num: '1', title: 'Name your pack', desc: 'This is what people see on Telegram. Max 64 chars.', icon: '✏️' },
    { num: '2', title: 'Upload files', desc: 'Drag & drop images, GIFs, or videos. We auto-convert to sticker format.', icon: '📤' },
    { num: '3', title: 'Pick emoji', desc: 'Each sticker needs at least 1 emoji so people can find it while typing.', icon: '😊' },
    { num: '4', title: 'Create & share', desc: 'Get a t.me/addstickers/ link to share with anyone on Telegram.', icon: '🚀' },
  ]

  return (
    <Container maxWidth="lg" sx={{ pt: 3, pb: 8 }}>
      <PageTransition>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

          {/* LEFT SIDEBAR — Guide */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, position: { md: 'sticky' }, top: { md: 24 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              <span className="gradient-text">New Sticker Pack</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.85rem' }}>
              Three steps to turn your files into a shareable Telegram sticker pack.
            </Typography>

            <Card sx={{ border: '1px solid rgba(179, 136, 255, 0.08)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {steps.map((step) => (
                    <Box key={step.num} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>
                        {step.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.25 }}>
                          {step.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>
                          {step.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, justifyContent: 'center' }}>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: '10px', background: 'rgba(179, 136, 255, 0.1)', border: '1px solid rgba(179, 136, 255, 0.15)', fontSize: '0.72rem', fontWeight: 600, color: '#b388ff' }}>🖼️ PNG · WebP · JPG</Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: '10px', background: 'rgba(255, 64, 129, 0.1)', border: '1px solid rgba(255, 64, 129, 0.15)', fontSize: '0.72rem', fontWeight: 600, color: '#ff4081' }}>🎬 GIF · MP4 · WebM</Box>
            </Box>
          </Box>

          {/* RIGHT MAIN — Form */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Top back bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton
                onClick={() => { haptic('light'); router.back() }}
                sx={{
                  color: 'text.secondary',
                  border: '1px solid rgba(179, 136, 255, 0.15)',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  '&:hover': { color: '#b388ff', borderColor: 'rgba(179, 136, 255, 0.35)', bgcolor: 'rgba(179, 136, 255, 0.06)' },
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                Back
              </Typography>
            </Box>

            {/* Account info card */}
            <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '10px',
                    background: botInfoState
                      ? 'linear-gradient(135deg, rgba(179, 136, 255, 0.25), rgba(255, 64, 129, 0.15))'
                      : 'linear-gradient(135deg, rgba(64, 196, 255, 0.25), rgba(105, 240, 174, 0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {botInfoState ? <SmartToyIcon sx={{ color: '#b388ff', fontSize: 18 }} /> : <PersonIcon sx={{ color: '#40c4ff', fontSize: 18 }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.76rem', display: 'block' }}>
                      {botInfoState ? `@${botInfoState.username}` : 'Account Login'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.66rem' }}>
                      {botInfoState ? botInfoState.first_name : 'Logged in as yourself'}
                    </Typography>
                  </Box>
                  <Box
                    onClick={handleSwitchBot}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      color: '#b388ff', cursor: 'pointer', fontSize: '0.66rem', fontWeight: 600,
                      padding: '3px 8px', borderRadius: '8px',
                      background: 'rgba(179, 136, 255, 0.08)',
                      border: '1px solid rgba(179, 136, 255, 0.12)',
                      transition: 'all 0.2s',
                      '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.15)' },
                    }}
                  >
                    <SwapHorizIcon sx={{ fontSize: 11 }} />
                    Switch
                  </Box>
                </Box>

                {/* User ID section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <PersonIcon sx={{ color: '#40c4ff', fontSize: 14 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#40c4ff', fontSize: '0.68rem' }}>
                    Telegram User ID
                  </Typography>
                </Box>

                {!editingId ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      flex: 1, py: 0.5, px: 1.25, borderRadius: '10px',
                      background: 'rgba(64, 196, 255, 0.06)', border: '1px solid rgba(64, 196, 255, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#82eaff', fontWeight: 600 }}>
                        {hiddenId ? '•••••••••' : currentUserId}
                      </Typography>
                      <Box
                        onClick={() => { haptic('light'); setHiddenId(!hiddenId) }}
                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'text.disabled', '&:hover': { color: '#82eaff' } }}
                      >
                        {hiddenId ? <VisibilityIcon sx={{ fontSize: 14 }} /> : <VisibilityOffIcon sx={{ fontSize: 14 }} />}
                      </Box>
                    </Box>
                    <Box
                      onClick={handleEditId}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        color: '#b388ff', cursor: 'pointer', fontSize: '0.66rem', fontWeight: 600,
                        padding: '4px 10px', borderRadius: '8px',
                        border: '1px solid rgba(179, 136, 255, 0.15)',
                        transition: 'all 0.2s',
                        '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.08)' },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 12 }} />
                      Change
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        fullWidth
                        value={idInput}
                        onChange={(e) => setIdInput(e.target.value)}
                        placeholder="Enter user ID"
                        type="number"
                        size="small"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveId() }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.78rem' } }}
                      />
                      <IconButton
                        onClick={handleSaveId}
                        size="small"
                        sx={{
                          color: '#69f0ae', border: '1px solid rgba(105, 240, 174, 0.2)',
                          borderRadius: '10px', '&:hover': { backgroundColor: 'rgba(105, 240, 174, 0.08)' },
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        onClick={handleCancelId}
                        size="small"
                        sx={{
                          color: '#ff867f', border: '1px solid rgba(255, 82, 82, 0.15)',
                          borderRadius: '10px', '&:hover': { backgroundColor: 'rgba(255, 82, 82, 0.08)' },
                        }}
                      >
                        <SwapHorizIcon sx={{ fontSize: 16, transform: 'rotate(45deg)' }} />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Step 1 */}
            <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: '8px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#b388ff' }}>1</Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pack Name ✏️</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                  This is the display name people see when they open your pack on Telegram. Make it fun.
                </Typography>
                <TextField
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Awesome Stickers"
                  disabled={loading}
                  slotProps={{ htmlInput: { maxLength: 64 } }}
                />
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                  Link will be <Box component="span" sx={{ fontFamily: 'monospace', color: '#b388ff' }}>t.me/addstickers/{botName() || 'yourpack'}</Box>
                </Typography>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: '8px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#b388ff' }}>2</Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Upload Files 📤</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                  Drag & drop or browse. Up to 50 files — we&apos;ll resize images to 512px and convert videos to WebM.
                </Typography>
                <FileUploader files={files} onFilesChange={setFiles} />
              </CardContent>
            </Card>

            {/* Step 3 */}
            {files.length > 0 && (
              <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ width: 26, height: 26, borderRadius: '8px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#b388ff' }}>3</Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pick Emoji 😊 ({files.length})</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                    Assign at least one emoji to each sticker. Up to 20 per sticker. Tap a button to open the picker.
                  </Typography>
                  <AnimatePresence>
                    {files.map((file, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      >
                        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '12px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, color: '#b388ff' }}>
                            {i + 1}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                              {file.file.name}
                            </Typography>
                            <EmojiPicker
                              selected={emojiLists[i] || []}
                              onChange={(emojis) => { const n = [...emojiLists]; n[i] = emojis; setEmojiLists(n) }}
                              index={i}
                            />
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {botNotStarted && botInfoState && (
              <Alert severity="warning" sx={{ mb: 2, '& .MuiAlert-icon': { color: '#ffd93d' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.82rem' }}>
                  You need to start your bot first! 🙏
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  {/* Copy username button */}
                  <Box
                    onClick={() => {
                      haptic('light')
                      copyToClipboard(`@${botInfoState.username}`)
                      setCopiedBot(true)
                      hapticNotify('success')
                      setTimeout(() => setCopiedBot(false), 2000)
                    }}
                    sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.5,
                      color: copiedBot ? '#69f0ae' : '#b388ff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                      padding: '6px 14px', borderRadius: '10px',
                      background: copiedBot ? 'rgba(105, 240, 174, 0.1)' : 'rgba(179, 136, 255, 0.1)',
                      border: `1px solid ${copiedBot ? 'rgba(105, 240, 174, 0.25)' : 'rgba(179, 136, 255, 0.25)'}`,
                      transition: 'all 0.2s',
                      '&:hover': { backgroundColor: copiedBot ? 'rgba(105, 240, 174, 0.18)' : 'rgba(179, 136, 255, 0.18)' },
                    }}
                  >
                    {copiedBot ? <CheckCircleIcon sx={{ fontSize: 15 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
                    {copiedBot ? 'Copied!' : `Copy @${botInfoState.username}`}
                  </Box>

                  {/* Open in Telegram button */}
                  <Box
                    onClick={() => { haptic('light'); window.open(`https://t.me/${botInfoState.username}`, '_blank') }}
                    sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.5,
                      color: '#ffd93d', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                      padding: '6px 14px', borderRadius: '10px',
                      background: 'rgba(255, 217, 61, 0.1)',
                      border: '1px solid rgba(255, 217, 61, 0.25)',
                      transition: 'all 0.2s',
                      '&:hover': { backgroundColor: 'rgba(255, 217, 61, 0.18)', borderColor: 'rgba(255, 217, 61, 0.4)' },
                    }}
                  >
                    Open in Telegram →
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem', lineHeight: 1.5 }}>
                  Option 1: Copy the username, paste it in your Saved Messages or any chat, tap it, then press Start.<br />
                  Option 2: Open the bot directly in a new tab and tap Start.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, fontSize: '0.72rem', color: '#69f0ae', fontWeight: 600 }}>
                  After starting, come back and try again. ✅
                </Typography>
              </Alert>
            )}

            {loading && (
              <Box sx={{ mb: 2 }}>
                <ProgressBar active={loading} current={files.length} total={files.length} label="Cooking your stickers... 👨‍🍳" />
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.72rem' }}>
                  Resizing, converting, and uploading to Telegram — a few seconds per file.
                </Typography>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleCreate}
              disabled={loading || !title.trim() || files.length === 0}
              sx={{ py: 1.5, fontSize: '1rem' }}
            >
              {loading ? 'Creating...' : `Make it! 🚀 (${files.length} sticker${files.length !== 1 ? 's' : ''})`}
            </Button>
            {files.length === 0 && (
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.72rem' }}>
                Upload at least one file to get started
              </Typography>
            )}
          </Box>
        </Box>
      </PageTransition>
    </Container>
  )
}

function botName(): string {
  if (typeof window === 'undefined') return 'yourbot'
  try {
    const raw = sessionStorage.getItem('tg_bot_info')
    if (raw) {
      const info = JSON.parse(raw)
      return info.username || 'yourbot'
    }
  } catch { /* noop */ }
  return 'yourbot'
}
