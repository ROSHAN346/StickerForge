'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Typography, Container, TextField, Button, Alert, Card, CardContent, InputAdornment, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import FileUploader, { UploadedFile } from '@/components/FileUploader'
import EmojiPicker from '@/components/EmojiPicker'
import ProgressBar from '@/components/ProgressBar'
import { addStickersToPack, addStickersToPackAsUser, getStickerSetInfo } from '@/lib/api'
import { getToken, getUserId, getPacks, updatePackCount, SavedPack, getBotInfo, getUserSession, getApiCreds, getLoginMethod } from '@/lib/storage'
import { haptic, hapticNotify, getTelegramUserId } from '@/lib/telegram'
import { copyToClipboard } from '@/lib/links'

function AddContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [packName, setPackName] = useState('')
  const [packInfo, setPackInfo] = useState<{ title: string; count: number } | null>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [emojiLists, setEmojiLists] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [botNotStarted, setBotNotStarted] = useState(false)
  const [copiedBot, setCopiedBot] = useState(false)
  const [savedPacks, setSavedPacks] = useState<SavedPack[]>([])

  useEffect(() => {
    const token = getToken()
    const session = getUserSession()
    const userId = getTelegramUserId() || getUserId()
    if (!userId || (!token && !session)) { router.push('/'); return }
    const bi = getBotInfo()
    if (bi) {
      setSavedPacks(getPacks().filter((p) => p.botUsername === bi.username))
    } else {
      setSavedPacks(getPacks())
    }
    const preselect = searchParams.get('pack')
    if (preselect) { setPackName(preselect); verifyPack(preselect) }
  }, [router, searchParams])

  useEffect(() => {
    setEmojiLists(files.map((_, i) => emojiLists[i] || []))
  }, [files])

  const verifyPack = async (name: string) => {
    if (!name.trim()) { setPackInfo(null); return }
    const token = getToken()
    if (!token) return
    setVerifying(true); setError('')
    try {
      const info = await getStickerSetInfo(token, name.trim())
      setPackInfo({ title: info.title, count: info.sticker_count })
      haptic('light')
    } catch (e) {
      setPackInfo(null)
      setError(e instanceof Error ? e.message : 'Pack not found 🤷')
    } finally {
      setVerifying(false)
    }
  }

  const handleAdd = async () => {
    if (!packName.trim()) { setError('Enter a pack name! 📝'); hapticNotify('error'); return }
    if (files.length === 0) { setError('Upload something first 🙄'); hapticNotify('error'); return }
    if (emojiLists.some((e) => e.length === 0)) { setError('Each sticker needs emoji 🙏'); hapticNotify('error'); return }

    const loginMethod = getLoginMethod()
    const userId = getTelegramUserId() || getUserId()
    if (!userId) { router.push('/'); return }

    setLoading(true); setError(''); setBotNotStarted(false)
    try {
      let result
      if (loginMethod === 'user') {
        const session = getUserSession()
        const creds = getApiCreds()
        if (!session || !creds) { router.push('/'); return }
        result = await addStickersToPackAsUser(session, creds.apiId, creds.apiHash, packName.trim(), files.map((f) => f.file), emojiLists)
      } else {
        const token = getToken()
        if (!token) { router.push('/'); return }
        result = await addStickersToPack(token, userId, packName.trim(), files.map((f) => f.file), emojiLists)
      }
      updatePackCount(packName.trim(), result.stickers_added)
      hapticNotify('success')
      router.push(`/result?link=${encodeURIComponent(result.pack_link)}&name=${encodeURIComponent(packName.trim())}&added=${result.stickers_added}`)
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
    { icon: '🔍', title: 'Find your pack', desc: 'Enter the pack name or pick from your saved packs below.' },
    { icon: '📤', title: 'Upload new files', desc: 'Drop images, GIFs, or videos to add to the pack.' },
    { icon: '😊', title: 'Pick emoji', desc: 'Assign at least one emoji to each new sticker.' },
  ]

  return (
    <Container maxWidth="lg" sx={{ pt: 3, pb: 8 }}>
      <PageTransition>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

          {/* LEFT SIDEBAR */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, position: { md: 'sticky' }, top: { md: 24 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              <span className="gradient-text">Add Stickers</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.85rem' }}>
              Already have a pack? Add more stickers to it in three quick steps.
            </Typography>

            <Card sx={{ border: '1px solid rgba(179, 136, 255, 0.08)', mb: 2 }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {steps.map((step, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
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

            <Card sx={{ border: '1px solid rgba(255, 217, 61, 0.1)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#ffd93d', fontSize: '0.8rem' }}>
                  ⚠️ Remember
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>
                  You must have sent <Box component="span" sx={{ fontFamily: 'monospace', color: '#ffd93d' }}>/start</Box> to the bot before adding stickers. The pack must already exist on Telegram.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* RIGHT MAIN */}
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

            {/* Step 1 — Find pack */}
            <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: '8px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#b388ff' }}>1</Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Find your pack 🔍</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                  Enter the pack name (after <Box component="span" sx={{ fontFamily: 'monospace', color: '#b388ff' }}>t.me/addstickers/</Box>) or tap a saved pack.
                </Typography>
                <TextField
                  fullWidth
                  value={packName}
                  onChange={(e) => { setPackName(e.target.value); setPackInfo(null) }}
                  onBlur={() => verifyPack(packName)}
                  placeholder="mycool_by_stickerbot"
                  disabled={loading}
                  sx={{ mb: 1.5 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 20, color: '#b388ff' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {verifying && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Checking if pack exists...</Typography>}

                {packInfo && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card sx={{ border: '1px solid rgba(105, 240, 174, 0.25)', bgcolor: 'rgba(105, 240, 174, 0.04)' }}>
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          ✅ {packInfo.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                          {packInfo.count} stickers already in this pack. New ones will be added at the end.
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {savedPacks.length > 0 && !packInfo && !verifying && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600, fontSize: '0.72rem' }}>
                      Your saved packs — tap to select, edit, or remix 👇
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {savedPacks.map((p) => {
                        const bi = getBotInfo()
                        const match = p.name.match(/_by_(.+)$/)
                        const packBot = match ? match[1] : ''
                        const ownPack = bi ? packBot.toLowerCase() === bi.username.toLowerCase() : false
                        return (
                          <Box
                            key={p.name}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1,
                              py: 0.75, px: 1.25, borderRadius: '12px',
                              bgcolor: 'rgba(21, 19, 31, 0.5)',
                              border: '1px solid rgba(179, 136, 255, 0.08)',
                              transition: 'all 0.2s',
                              '&:hover': { borderColor: 'rgba(179, 136, 255, 0.2)' },
                            }}
                          >
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '8px',
                              background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <Typography sx={{ fontSize: '0.7rem' }}>🎨</Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.76rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.title}
                              </Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                                {p.stickerCount} stickers · @{p.botUsername}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                              <Box
                                onClick={() => { haptic('light'); setPackName(p.name); verifyPack(p.name) }}
                                sx={{
                                  fontSize: '0.66rem', fontWeight: 600, color: '#b388ff', cursor: 'pointer',
                                  padding: '3px 8px', borderRadius: '8px',
                                  background: 'rgba(179, 136, 255, 0.08)',
                                  border: '1px solid rgba(179, 136, 255, 0.15)',
                                  '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.15)' },
                                }}
                              >
                                Add
                              </Box>
                              {ownPack && (
                                <Box
                                  onClick={() => { haptic('light'); router.push(`/edit?pack=${encodeURIComponent(p.name)}`) }}
                                  sx={{
                                    fontSize: '0.66rem', fontWeight: 600, color: '#69f0ae', cursor: 'pointer',
                                    padding: '3px 8px', borderRadius: '8px',
                                    background: 'rgba(105, 240, 174, 0.08)',
                                    border: '1px solid rgba(105, 240, 174, 0.15)',
                                    '&:hover': { backgroundColor: 'rgba(105, 240, 174, 0.15)' },
                                  }}
                                >
                                  Edit
                                </Box>
                              )}
                              <Box
                                onClick={() => { haptic('light'); router.push(`/remix?pack=${encodeURIComponent(p.name)}`) }}
                                sx={{
                                  fontSize: '0.66rem', fontWeight: 600, color: '#ff4081', cursor: 'pointer',
                                  padding: '3px 8px', borderRadius: '8px',
                                  background: 'rgba(255, 64, 129, 0.08)',
                                  border: '1px solid rgba(255, 64, 129, 0.15)',
                                  '&:hover': { backgroundColor: 'rgba(255, 64, 129, 0.15)' },
                                }}
                              >
                                Remix
                              </Box>
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Step 2 + 3 — only show after pack verified */}
            {packInfo && (
              <>
                <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '8px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#b388ff' }}>2</Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Upload New Files 📤</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                      Drop new images, GIFs, or videos. They&apos;ll be converted and added to your pack.
                    </Typography>
                    <FileUploader files={files} onFilesChange={setFiles} />
                  </CardContent>
                </Card>

                {files.length > 0 && (
                  <Card sx={{ mb: 2.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Box sx={{ width: 26, height: 26, borderRadius: '8px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#b388ff' }}>3</Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pick Emoji 😊 ({files.length})</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                        Assign at least one emoji to each new sticker.
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

                {botNotStarted && (
                  <Alert severity="warning" sx={{ mb: 2, '& .MuiAlert-icon': { color: '#ffd93d' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.82rem' }}>
                      You need to start your bot first! 🙏
                    </Typography>
                    {(() => {
                      const bi = getBotInfo()
                      if (!bi) return null
                      return (
                        <Box>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                            {/* Copy username button */}
                            <Box
                              onClick={() => {
                                haptic('light')
                                copyToClipboard(`@${bi.username}`)
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
                              {copiedBot ? 'Copied!' : `Copy @${bi.username}`}
                            </Box>

                            {/* Open in Telegram button */}
                            <Box
                              onClick={() => { haptic('light'); window.open(`https://t.me/${bi.username}`, '_blank') }}
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
                        </Box>
                      )
                    })()}
                  </Alert>
                )}

                {loading && (
                  <Box sx={{ mb: 2 }}>
                    <ProgressBar active={loading} current={files.length} total={files.length} label="Adding stickers... ⚡" />
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.72rem' }}>
                      Converting and uploading each file. Almost there!
                    </Typography>
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleAdd}
                  disabled={loading || files.length === 0}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                >
                  {loading ? 'Adding...' : `Add ${files.length} sticker${files.length !== 1 ? 's' : ''} to pack 🔥`}
                </Button>
                {files.length === 0 && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.72rem' }}>
                    Upload some files first to add them to this pack
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>
      </PageTransition>
    </Container>
  )
}

export default function AddPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Loading...</Typography></Box>}>
      <AddContent />
    </Suspense>
  )
}
