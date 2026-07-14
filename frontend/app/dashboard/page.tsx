'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, Container, Button, Card, CardContent, IconButton, Divider, TextField, Collapse, Dialog, DialogTitle, DialogContent, CircularProgress, Alert, InputAdornment, Chip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import SearchIcon from '@mui/icons-material/Search'
import SendIcon from '@mui/icons-material/Send'
import FilterListIcon from '@mui/icons-material/FilterList'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import LanguageIcon from '@mui/icons-material/Language'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import CloudSyncIcon from '@mui/icons-material/CloudSync'
import { motion } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import PackCard from '@/components/PackCard'
import StickerImage from '@/components/StickerImage'
import { getPacks, getPacksByUserId, getUniqueBots, deletePack, savePack, SavedPack, getToken, getBotInfo, getUserId, setUserId, clearAll, BotInfoStorage, getUserSession, getApiCreds, getLoginMethod, getUserInfo, UserInfoStorage } from '@/lib/storage'
import { haptic, hapticNotify, getTelegramUserId } from '@/lib/telegram'
import { openTelegramLink, openTelegramApp } from '@/lib/links'
import { copyToClipboard } from '@/lib/links'
import { getStickerSetDetail, getStickerSetDetailAsUser, getStickerSetInfo, deleteStickerPack, getAllStickerPacksAsUser, StickerSetDetail, StickerSetInfo, TelegramPackInfo } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [packs, setPacks] = useState<SavedPack[]>([])
  const [botInfo, setBotInfo] = useState<BotInfoStorage | null>(null)
  const [userInfo, setUserInfoState] = useState<UserInfoStorage | null>(null)
  const [userId, setUserIdState] = useState<number | null>(null)
  const [editingId, setEditingId] = useState(false)
  const [idInput, setIdInput] = useState('')
  const [showIdHelp, setShowIdHelp] = useState(false)
  const [hiddenId, setHiddenId] = useState(true)
  const [viewPack, setViewPack] = useState<SavedPack | null>(null)
  const [stickerDetail, setStickerDetail] = useState<StickerSetDetail | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'count'>('recent')
  const [copiedLink, setCopiedLink] = useState(false)
  const [botFilter, setBotFilter] = useState<string | null>(null)
  const [showAddExisting, setShowAddExisting] = useState(false)
  const [existingPackName, setExistingPackName] = useState('')
  const [existingPackLoading, setExistingPackLoading] = useState(false)
  const [existingPackError, setExistingPackError] = useState('')
  const [existingPackDetail, setExistingPackDetail] = useState<StickerSetDetail | null>(null)
  const [existingPackInfo, setExistingPackInfo] = useState<StickerSetInfo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SavedPack | null>(null)
  const [deleteFromTelegram, setDeleteFromTelegram] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [telegramPacks, setTelegramPacks] = useState<TelegramPackInfo[]>([])
  const [telegramPacksLoading, setTelegramPacksLoading] = useState(false)
  const [telegramPacksError, setTelegramPacksError] = useState('')
  const [showTelegramPacks, setShowTelegramPacks] = useState(false)

  useEffect(() => {
    const token = getToken()
    const info = getBotInfo()
    const session = getUserSession()
    const method = getLoginMethod()
    const uid = getTelegramUserId() || getUserId()

    if (method === 'user' && session && uid) {
      setUserIdState(uid)
      setUserInfoState(getUserInfo())
      setPacks(getPacks())
      return
    }
    if (!token || !info || !uid) { router.push('/'); return }
    setBotInfo(info)
    setBotFilter(info.username)
    setUserIdState(uid)
    setPacks(getPacks())
  }, [router])

  const handleDelete = (name: string) => {
    hapticNotify('warning')
    deletePack(name)
    setPacks(getPacks())
  }

  const handleDeleteClick = (pack: SavedPack) => {
    haptic('medium')
    setDeleteTarget(pack)
    setDeleteFromTelegram(false)
    setDeleteError('')
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      if (deleteFromTelegram) {
        const token = getToken()
        if (!token) { setDeleteError('Bot token not found'); setDeleteLoading(false); return }
        await deleteStickerPack(token, deleteTarget.name)
      }
      deletePack(deleteTarget.name)
      setPacks(getPacks())
      hapticNotify('success')
      setDeleteTarget(null)
      setDeleteFromTelegram(false)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete')
      hapticNotify('error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCloseDelete = () => {
    haptic('light')
    setDeleteTarget(null)
    setDeleteFromTelegram(false)
    setDeleteError('')
  }

  const handleDisconnect = () => {
    haptic('medium')
    hapticNotify('warning')
    clearAll()
    router.push('/')
  }

  const handleClearAll = () => {
    haptic('medium')
    hapticNotify('warning')
    clearAll()
    router.push('/')
  }

  const handleEditId = () => {
    haptic('light')
    setIdInput(String(userId || ''))
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
    setUserIdState(Number(trimmed))
    setEditingId(false)
  }

  const handleCancelId = () => {
    haptic('light')
    setEditingId(false)
  }

  const handleView = async (pack: SavedPack) => {
    haptic('light')
    setViewPack(pack)
    setViewError('')

    setViewLoading(true)
    setStickerDetail(null)

    const method = getLoginMethod()

    try {
      let detail: StickerSetDetail
      if (method === 'user') {
        const session = getUserSession()
        const creds = getApiCreds()
        if (!session || !creds) {
          setViewError('Session not found. Please reconnect.')
          setViewLoading(false)
          return
        }
        detail = await getStickerSetDetailAsUser(session, creds.apiId, creds.apiHash, pack.name)
      } else {
        const token = getToken()
        if (!token) {
          setViewError('Bot token not found. Please reconnect.')
          setViewLoading(false)
          return
        }
        detail = await getStickerSetDetail(token, pack.name)
      }
      setStickerDetail(detail)
    } catch (e) {
      setViewError(e instanceof Error ? e.message : 'Failed to load stickers')
    } finally {
      setViewLoading(false)
    }
  }

  const handleCloseView = () => {
    haptic('light')
    setViewPack(null)
    setStickerDetail(null)
    setViewError('')
  }

  const handleSearchExistingPack = async () => {
    const name = existingPackName.trim()
    if (!name) { setExistingPackError('Enter a pack name or link'); hapticNotify('error'); return }

    setExistingPackLoading(true)
    setExistingPackError('')
    setExistingPackDetail(null)
    setExistingPackInfo(null)
    try {
      if (isUserLogin) {
        const session = getUserSession()
        const creds = getApiCreds()
        if (!session || !creds) { setExistingPackError('Session not found. Please reconnect.'); hapticNotify('error'); return }
        const detail = await getStickerSetDetailAsUser(session, creds.apiId, creds.apiHash, name)
        setExistingPackDetail(detail)
        setExistingPackInfo({ name: detail.name, title: detail.title, sticker_type: detail.sticker_type, sticker_count: detail.sticker_count })
      } else {
        const token = getToken()
        if (!token) { setExistingPackError('Bot token not found. Please reconnect.'); hapticNotify('error'); return }
        const detail = await getStickerSetDetail(token, name)
        setExistingPackDetail(detail)
        setExistingPackInfo({ name: detail.name, title: detail.title, sticker_type: detail.sticker_type, sticker_count: detail.sticker_count })
      }
      haptic('light')
    } catch (e) {
      setExistingPackError(e instanceof Error ? e.message : 'Pack not found')
      hapticNotify('error')
    } finally {
      setExistingPackLoading(false)
    }
  }

  const handleConfirmImport = () => {
    if (!existingPackInfo) return
    const match = existingPackInfo.name.match(/_by_(.+)$/)
    const botUser = match ? match[1] : botInfo?.username || 'unknown'
    savePack({
      name: existingPackInfo.name,
      title: existingPackInfo.title,
      link: `https://t.me/addstickers/${existingPackInfo.name}`,
      botUsername: botUser,
      stickerCount: existingPackInfo.sticker_count,
      createdAt: Date.now(),
      userId: userId || undefined,
    })
    setPacks(getPacks())
    hapticNotify('success')
    handleCloseAddExisting()
  }

  const handleCloseAddExisting = () => {
    haptic('light')
    setShowAddExisting(false)
    setExistingPackName('')
    setExistingPackError('')
    setExistingPackDetail(null)
    setExistingPackInfo(null)
  }

  const handleSyncTelegramPacks = async () => {
    haptic('medium')
    setTelegramPacksLoading(true)
    setTelegramPacksError('')
    try {
      const session = getUserSession()
      const creds = getApiCreds()
      if (!session || !creds) { setTelegramPacksError('Session not found. Please reconnect.'); setTelegramPacksLoading(false); return }
      const result = await getAllStickerPacksAsUser(session, creds.apiId, creds.apiHash)
      setTelegramPacks(result)
      setShowTelegramPacks(true)
      hapticNotify('success')
    } catch (e) {
      setTelegramPacksError(e instanceof Error ? e.message : 'Failed to fetch packs')
      hapticNotify('error')
    } finally {
      setTelegramPacksLoading(false)
    }
  }

  const handleImportTelegramPack = (pack: TelegramPackInfo) => {
    haptic('light')
    const match = pack.name.match(/_by_(.+)$/)
    const botUser = match ? match[1] : 'user'
    const existing = getPacks().find((p) => p.name === pack.name)
    if (!existing) {
      savePack({
        name: pack.name,
        title: pack.title,
        link: `https://t.me/addstickers/${pack.name}`,
        botUsername: botUser,
        stickerCount: pack.sticker_count,
        createdAt: Date.now(),
        userId: userId || undefined,
      })
      setPacks(getPacks())
    }
    hapticNotify('success')
  }

  const isUserLogin = getLoginMethod() === 'user'

  const isOwnPack = (pack: SavedPack, botUsername?: string) => {
    if (isUserLogin) return true
    if (!botUsername) return false
    const match = pack.name.match(/_by_(.+)$/)
    const packBot = match ? match[1] : ''
    return packBot.toLowerCase() === botUsername.toLowerCase()
  }

  const uniqueBots = [...new Set(packs.map((p) => p.botUsername))]

  const filteredPacks = packs
    .filter((p) => {
      if (botFilter && p.botUsername.toLowerCase() !== botFilter.toLowerCase()) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return p.title.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.botUsername.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title)
      if (sortBy === 'count') return b.stickerCount - a.stickerCount
      return b.createdAt - a.createdAt
    })

  return (
    <Container maxWidth="lg" sx={{ pt: 3, pb: 3 }}>
      <PageTransition>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

          {/* LEFT SIDEBAR */}
          <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0, position: { md: 'sticky' }, top: { md: 24 } }}>
            {/* Bot info / User info */}
            {(botInfo || userInfo) && (
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: '16px',
                      background: botInfo
                        ? 'linear-gradient(135deg, rgba(179, 136, 255, 0.3), rgba(255, 64, 129, 0.2))'
                        : 'linear-gradient(135deg, rgba(64, 196, 255, 0.3), rgba(105, 240, 174, 0.2))',
                      border: `1px solid ${botInfo ? 'rgba(179, 136, 255, 0.2)' : 'rgba(64, 196, 255, 0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {botInfo ? <SmartToyIcon sx={{ color: '#b388ff', fontSize: 24 }} /> : <PersonIcon sx={{ color: '#40c4ff', fontSize: 24 }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {botInfo ? botInfo.first_name : (userInfo?.first_name || 'User')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {botInfo ? `@${botInfo.username}` : (userInfo?.username ? `@${userInfo.username}` : userInfo?.phone || '')}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                      {botInfo ? `Bot ID: ${botInfo.id}` : `User ID: ${userInfo?.user_id}`}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Box
                        onClick={handleDisconnect}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 0.5,
                          color: '#b388ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                          padding: '5px 12px', borderRadius: '10px',
                          background: 'rgba(179, 136, 255, 0.08)',
                          border: '1px solid rgba(179, 136, 255, 0.15)',
                          transition: 'all 0.2s',
                          '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.15)', borderColor: 'rgba(179, 136, 255, 0.3)' },
                        }}
                      >
                        <SwapHorizIcon sx={{ fontSize: 14 }} />
                        Switch
                      </Box>
                      <Box
                        onClick={handleClearAll}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 0.5,
                          color: '#ff867f', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                          padding: '5px 12px', borderRadius: '10px',
                          background: 'rgba(255, 82, 82, 0.06)',
                          border: '1px solid rgba(255, 82, 82, 0.12)',
                          transition: 'all 0.2s',
                          '&:hover': { backgroundColor: 'rgba(255, 82, 82, 0.12)', borderColor: 'rgba(255, 82, 82, 0.25)' },
                        }}
                      >
                        <DeleteForeverIcon sx={{ fontSize: 14 }} />
                        Clear All
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* User ID */}
            {userId && (
              <Card sx={{ mb: 2, border: '1px solid rgba(64, 196, 255, 0.1)' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <PersonIcon sx={{ color: '#40c4ff', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#40c4ff', fontSize: '0.82rem' }}>
                      Your Telegram User ID
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.78rem', lineHeight: 1.5 }}>
                    This is the account that owns the sticker packs. Make sure you&apos;ve sent /start to the bot from this account.
                  </Typography>

                  {!editingId ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        flex: 1, py: 0.75, px: 1.5, borderRadius: '12px',
                        background: 'rgba(64, 196, 255, 0.06)', border: '1px solid rgba(64, 196, 255, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#82eaff', fontWeight: 600 }}>
                          {hiddenId ? '•••••••••' : userId}
                        </Typography>
                        <Box
                          onClick={() => { haptic('light'); setHiddenId(!hiddenId) }}
                          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'text.disabled', '&:hover': { color: '#82eaff' } }}
                        >
                          {hiddenId ? <VisibilityIcon sx={{ fontSize: 16 }} /> : <VisibilityOffIcon sx={{ fontSize: 16 }} />}
                        </Box>
                      </Box>
                      <Box
                        onClick={handleEditId}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 0.5,
                          color: '#b388ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                          padding: '6px 12px', borderRadius: '10px',
                          border: '1px solid rgba(179, 136, 255, 0.15)',
                          transition: 'all 0.2s',
                          '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.08)', borderColor: 'rgba(179, 136, 255, 0.3)' },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 14 }} />
                        Change
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <TextField
                          fullWidth
                          value={idInput}
                          onChange={(e) => setIdInput(e.target.value)}
                          placeholder="Enter user ID"
                          type="number"
                          size="small"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveId() }}
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                          }}
                        />
                        <IconButton
                          onClick={handleSaveId}
                          size="small"
                          sx={{
                            color: '#69f0ae', border: '1px solid rgba(105, 240, 174, 0.2)',
                            borderRadius: '12px', '&:hover': { backgroundColor: 'rgba(105, 240, 174, 0.08)' },
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          onClick={handleCancelId}
                          size="small"
                          sx={{
                            color: '#ff867f', border: '1px solid rgba(255, 82, 82, 0.15)',
                            borderRadius: '12px', '&:hover': { backgroundColor: 'rgba(255, 82, 82, 0.08)' },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>

                      {/* Dropdown help */}
                      <Box
                        onClick={() => { haptic('light'); setShowIdHelp(!showIdHelp) }}
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', py: 0.75, px: 1.5, borderRadius: '10px',
                          background: 'rgba(179, 136, 255, 0.06)', border: '1px solid rgba(179, 136, 255, 0.1)',
                          transition: 'all 0.2s',
                          '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.1)' },
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#b388ff' }}>
                          ❓ How to find your User ID
                        </Typography>
                        {showIdHelp ? <ExpandLessIcon sx={{ fontSize: 16, color: '#b388ff' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#b388ff' }} />}
                      </Box>
                      <Collapse in={showIdHelp}>
                        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {/* Method 1 */}
                          <Box sx={{
                            p: 1.5, borderRadius: '12px',
                            background: 'rgba(21, 19, 31, 0.5)', border: '1px solid rgba(179, 136, 255, 0.08)',
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#69f0ae', fontSize: '0.72rem', mb: 0.5, display: 'block' }}>
                              🟢 Easiest — @userinfobot
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5, mb: 1 }}>
                              Opens a bot that instantly replies with your numeric ID.
                            </Typography>
                            <Box
                              component="span"
                              onClick={() => openTelegramLink('https://t.me/userinfobot')}
                              sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                color: '#b388ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                                textDecoration: 'underline',
                              }}
                            >
                              Open @userinfobot →
                            </Box>
                          </Box>

                          {/* Method 2 */}
                          <Box sx={{
                            p: 1.5, borderRadius: '12px',
                            background: 'rgba(21, 19, 31, 0.5)', border: '1px solid rgba(179, 136, 255, 0.08)',
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#40c4ff', fontSize: '0.72rem', mb: 0.5, display: 'block' }}>
                              🔵 Alternative — @getidsbot
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5, mb: 1 }}>
                              Send any message to this bot and it responds with your ID.
                            </Typography>
                            <Box
                              component="span"
                              onClick={() => openTelegramLink('https://t.me/getidsbot')}
                              sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                color: '#b388ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                                textDecoration: 'underline',
                              }}
                            >
                              Open @getidsbot →
                            </Box>
                          </Box>

                          {/* Method 3 */}
                          <Box sx={{
                            p: 1.5, borderRadius: '12px',
                            background: 'rgba(21, 19, 31, 0.5)', border: '1px solid rgba(179, 136, 255, 0.08)',
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#ffd93d', fontSize: '0.72rem', mb: 0.5, display: 'block' }}>
                              🟡 Manual — Bot API
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5, mb: 0.5 }}>
                              Send any message to your bot, then open this URL in your browser:
                            </Typography>
                            <Box sx={{
                              p: 1, borderRadius: '8px', background: 'rgba(10, 10, 15, 0.6)',
                              fontFamily: 'monospace', fontSize: '0.68rem', color: '#b388ff',
                              wordBreak: 'break-all', mb: 0.5,
                            }}>
                              api.telegram.org/bot&lt;YOUR_TOKEN&gt;/getUpdates
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.5 }}>
                              Look for <Box component="span" sx={{ fontFamily: 'monospace', color: '#82eaff' }}>&quot;chat&quot;:&#123;&quot;id&quot;:123456789&#125;</Box> in the response.
                            </Typography>
                          </Box>
                        </Box>
                      </Collapse>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
            <Card sx={{ mb: 2, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AutoAwesomeMotionIcon sx={{ color: '#b388ff', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b388ff' }}>
                    How it works
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '7px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, color: '#b388ff' }}>1</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                      Tap <strong style={{ color: '#f5f0ff' }}>New Pack</strong> and give it a name
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '7px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, color: '#b388ff' }}>2</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                      Upload images, GIFs, or videos — we auto-convert them
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '7px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, color: '#b388ff' }}>3</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                      Pick emoji for each sticker and hit create
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '7px', background: 'rgba(105, 240, 174, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem' }}>✓</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                      Get a shareable link like <Box component="span" sx={{ fontFamily: 'monospace', color: '#b388ff', fontSize: '0.75rem' }}>t.me/addstickers/...</Box>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Pro tips */}
            <Card sx={{ border: '1px solid rgba(179, 136, 255, 0.08)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TipsAndUpdatesIcon sx={{ color: '#ffd93d', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffd93d' }}>
                    Pro Tips
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <strong style={{ color: '#69f0ae' }}>·</strong> Images auto-resize to 512px
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <strong style={{ color: '#69f0ae' }}>·</strong> GIFs & videos → WebM VP9
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <strong style={{ color: '#69f0ae' }}>·</strong> Up to 20 emoji per sticker
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <strong style={{ color: '#69f0ae' }}>·</strong> Share your pack link anywhere
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* RIGHT MAIN CONTENT */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Welcome banner for user-login */}
            {isUserLogin && userInfo && (
              <Card sx={{ mb: 2.5, border: '1px solid rgba(64, 196, 255, 0.12)', background: 'linear-gradient(135deg, rgba(64, 196, 255, 0.05), rgba(105, 240, 174, 0.03))' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '1.2rem' }}>👋</Typography>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Welcome, {userInfo.first_name}!
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Logged in as your Telegram account · No bot needed · {packs.length} pack{packs.length !== 1 ? 's' : ''} created
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Action cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Box onClick={() => { haptic('medium'); router.push('/create') }} sx={{ flex: 1, cursor: 'pointer' }}>
                <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}>
                  <Card sx={{ height: '100%', border: '1px solid rgba(179, 136, 255, 0.15)', '&:hover': { borderColor: 'rgba(179, 136, 255, 0.3)', boxShadow: '0 8px 30px rgba(179, 136, 255, 0.12)' } }}>
                    <CardContent sx={{ py: 3, '&:last-child': { pb: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: '16px', background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.25), rgba(179, 136, 255, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AddIcon sx={{ color: '#b388ff', fontSize: 26 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>New Pack</Typography>
                          <Typography variant="caption" color="text.secondary">Create from scratch ✨</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              <Box onClick={() => { haptic('medium'); router.push('/add') }} sx={{ flex: 1, cursor: 'pointer' }}>
                <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}>
                  <Card sx={{ height: '100%', border: '1px solid rgba(255, 64, 129, 0.15)', '&:hover': { borderColor: 'rgba(255, 64, 129, 0.3)', boxShadow: '0 8px 30px rgba(255, 64, 129, 0.12)' } }}>
                    <CardContent sx={{ py: 3, '&:last-child': { pb: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255, 64, 129, 0.25), rgba(255, 64, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PlaylistAddIcon sx={{ color: '#ff4081', fontSize: 26 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>Add to Pack</Typography>
                          <Typography variant="caption" color="text.secondary">Drop more stickers 🔥</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {isUserLogin && (
                <Box onClick={() => handleSyncTelegramPacks()} sx={{ flex: 1, cursor: 'pointer' }}>
                  <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}>
                    <Card sx={{ height: '100%', border: '1px solid rgba(64, 196, 255, 0.15)', '&:hover': { borderColor: 'rgba(64, 196, 255, 0.3)', boxShadow: '0 8px 30px rgba(64, 196, 255, 0.12)' } }}>
                      <CardContent sx={{ py: 3, '&:last-child': { pb: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 52, height: 52, borderRadius: '16px', background: 'linear-gradient(135deg, rgba(64, 196, 255, 0.25), rgba(64, 196, 255, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {telegramPacksLoading ? <CircularProgress size={26} sx={{ color: '#40c4ff' }} /> : <CloudSyncIcon sx={{ color: '#40c4ff', fontSize: 26 }} />}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>My Telegram Packs</Typography>
                            <Typography variant="caption" color="text.secondary">Sync all installed packs ☁️</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(179, 136, 255, 0.08)', mb: 2 }} />

            {/* My Telegram Packs section — Account Login only */}
            {isUserLogin && showTelegramPacks && (
              <Card sx={{ mb: 2.5, border: '1px solid rgba(64, 196, 255, 0.12)' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudSyncIcon sx={{ color: '#40c4ff', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#40c4ff' }}>
                        My Telegram Packs ({telegramPacks.length})
                      </Typography>
                    </Box>
                    <Box
                      onClick={() => { haptic('light'); setShowTelegramPacks(false) }}
                      sx={{ cursor: 'pointer', color: 'text.disabled', '&:hover': { color: '#b388ff' }, fontSize: '0.72rem', fontWeight: 600 }}
                    >
                      Collapse
                    </Box>
                  </Box>

                  {telegramPacksError && <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.8rem' }}>{telegramPacksError}</Alert>}

                  {telegramPacks.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 300, overflowY: 'auto' }}>
                      {telegramPacks.map((tp) => {
                        const alreadySaved = packs.some((p) => p.name === tp.name)
                        return (
                          <Box
                            key={tp.name}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1,
                              py: 0.75, px: 1.25, borderRadius: '12px',
                              bgcolor: 'rgba(21, 19, 31, 0.5)',
                              border: '1px solid rgba(64, 196, 255, 0.08)',
                              transition: 'all 0.2s',
                              '&:hover': { borderColor: 'rgba(64, 196, 255, 0.2)' },
                            }}
                          >
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '8px',
                              background: 'linear-gradient(135deg, rgba(64, 196, 255, 0.2), rgba(105, 240, 174, 0.1))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <Typography sx={{ fontSize: '0.7rem' }}>🎨</Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.76rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {tp.title}
                              </Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                                {tp.sticker_count} stickers · {tp.name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                              {alreadySaved ? (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.62rem', fontWeight: 600, color: '#69f0ae', padding: '3px 8px', borderRadius: '8px', background: 'rgba(105, 240, 174, 0.08)', border: '1px solid rgba(105, 240, 174, 0.15)' }}>
                                  <CheckIcon sx={{ fontSize: 12 }} /> Added
                                </Box>
                              ) : (
                                <Box
                                  onClick={() => handleImportTelegramPack(tp)}
                                  sx={{
                                    fontSize: '0.62rem', fontWeight: 600, color: '#40c4ff', cursor: 'pointer',
                                    padding: '3px 10px', borderRadius: '8px',
                                    background: 'rgba(64, 196, 255, 0.08)',
                                    border: '1px solid rgba(64, 196, 255, 0.15)',
                                    '&:hover': { backgroundColor: 'rgba(64, 196, 255, 0.15)' },
                                  }}
                                >
                                  + Add
                                </Box>
                              )}
                              <Box
                                onClick={() => { haptic('light'); router.push(`/remix?pack=${encodeURIComponent(tp.name)}`) }}
                                sx={{
                                  fontSize: '0.62rem', fontWeight: 600, color: '#ff4081', cursor: 'pointer',
                                  padding: '3px 10px', borderRadius: '8px',
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
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontSize: '0.82rem' }}>
                      No sticker packs found on your Telegram account.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pack list header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {isUserLogin ? 'All Sticker Packs' : 'Your Packs'} <Typography component="span" color="text.disabled" sx={{ fontSize: '0.8rem', fontWeight: 400 }}>({filteredPacks.length}{searchQuery.trim() && filteredPacks.length !== packs.length ? ` of ${packs.length}` : ''})</Typography>
              </Typography>
              {!isUserLogin && (
                <Box
                  onClick={() => { haptic('light'); setShowAddExisting(true) }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    color: '#b388ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                    padding: '5px 12px', borderRadius: '10px',
                    background: 'rgba(179, 136, 255, 0.08)',
                    border: '1px solid rgba(179, 136, 255, 0.15)',
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.15)', borderColor: 'rgba(179, 136, 255, 0.3)' },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 14 }} />
                  Import Pack
                </Box>
              )}
              {isUserLogin && (
                <Box
                  onClick={() => { haptic('light'); setShowAddExisting(true) }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    color: '#40c4ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                    padding: '5px 12px', borderRadius: '10px',
                    background: 'rgba(64, 196, 255, 0.08)',
                    border: '1px solid rgba(64, 196, 255, 0.15)',
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: 'rgba(64, 196, 255, 0.15)', borderColor: 'rgba(64, 196, 255, 0.3)' },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 14 }} />
                  Import Pack
                </Box>
              )}
            </Box>

            {/* Search + filter bar */}
            {packs.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search packs by name, title, or bot..."
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchQuery('')}>
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  sx={{
                    mb: 1.5,
                    '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.82rem' },
                  }}
                />
                {/* Sort chips */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterListIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>Sort:</Typography>
                  </Box>
                  {(['recent', 'name', 'count'] as const).map((option) => (
                    <Chip
                      key={option}
                      label={option === 'recent' ? 'Recent' : option === 'name' ? 'A-Z' : 'Stickers'}
                      size="small"
                      onClick={() => { haptic('light'); setSortBy(option) }}
                      sx={{
                        fontSize: '0.68rem', height: 24, borderRadius: '8px',
                        bgcolor: sortBy === option ? 'rgba(179, 136, 255, 0.15)' : 'transparent',
                        color: sortBy === option ? '#b388ff' : 'text.disabled',
                        border: `1px solid ${sortBy === option ? 'rgba(179, 136, 255, 0.3)' : 'rgba(179, 136, 255, 0.1)'}`,
                        '&:hover': { bgcolor: 'rgba(179, 136, 255, 0.1)' },
                      }}
                    />
                  ))}
                </Box>

                {/* Bot filter chips */}
                {uniqueBots.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SmartToyIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>Bots:</Typography>
                    </Box>
                    <Chip
                      label="All"
                      size="small"
                      onClick={() => { haptic('light'); setBotFilter(null) }}
                      sx={{
                        fontSize: '0.66rem', height: 24, borderRadius: '8px',
                        bgcolor: botFilter === null ? 'rgba(179, 136, 255, 0.15)' : 'transparent',
                        color: botFilter === null ? '#b388ff' : 'text.disabled',
                        border: `1px solid ${botFilter === null ? 'rgba(179, 136, 255, 0.3)' : 'rgba(179, 136, 255, 0.1)'}`,
                        '&:hover': { bgcolor: 'rgba(179, 136, 255, 0.1)' },
                      }}
                    />
                    {uniqueBots.map((bot) => (
                      <Chip
                        key={bot}
                        label={`@${bot}`}
                        size="small"
                        onClick={() => { haptic('light'); setBotFilter(botFilter?.toLowerCase() === bot.toLowerCase() ? null : bot) }}
                        sx={{
                          fontSize: '0.66rem', height: 24, borderRadius: '8px',
                          bgcolor: botFilter?.toLowerCase() === bot.toLowerCase() ? 'rgba(130, 234, 255, 0.15)' : 'transparent',
                          color: botFilter?.toLowerCase() === bot.toLowerCase() ? '#82eaff' : 'text.disabled',
                          border: `1px solid ${botFilter?.toLowerCase() === bot.toLowerCase() ? 'rgba(130, 234, 255, 0.3)' : 'rgba(130, 234, 255, 0.1)'}`,
                          '&:hover': { bgcolor: 'rgba(130, 234, 255, 0.1)' },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {filteredPacks.length > 0 ? (
              <Box>
                {filteredPacks.map((pack, i) => (
                  <PackCard
                    key={pack.name}
                    pack={pack}
                    index={i}
                    onDelete={(p) => handleDeleteClick(p)}
                    onSend={(p) => { haptic('light'); router.push(`/result?link=${encodeURIComponent(p.link)}&name=${encodeURIComponent(p.name)}`) }}
                    onView={(p) => handleView(p)}
                    onEditFull={isOwnPack(pack, botInfo?.username) ? (p) => { haptic('light'); router.push(`/edit?pack=${encodeURIComponent(p.name)}`) } : undefined}
                    onEdit={!isOwnPack(pack, botInfo?.username) ? (p) => { haptic('light'); router.push(`/add?pack=${encodeURIComponent(p.name)}`) } : undefined}
                    onRemix={(p) => { haptic('light'); router.push(`/remix?pack=${encodeURIComponent(p.name)}`) }}
                  />
                ))}
              </Box>
            ) : packs.length > 0 && (searchQuery.trim() || botFilter) ? (
              <Card sx={{ border: '1px solid rgba(179, 136, 255, 0.06)', py: 3 }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: 32, mb: 1 }}>🔍</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    No packs found
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
                    Try a different search term
                  </Typography>
                </CardContent>
              </Card>
            ) : packs.length === 0 ? (
              <Card sx={{ border: '1px solid rgba(179, 136, 255, 0.06)', py: 4 }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: 40, mb: 1 }}>📭</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    No packs yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                    {isUserLogin
                      ? "You haven't created any sticker packs yet. Tap New Pack above to make your first one."
                      : "You haven't created any sticker packs. Tap New Pack above to make your first one — it takes like 30 seconds."}
                  </Typography>
                </CardContent>
              </Card>
            ) : null}
          </Box>
        </Box>
      </PageTransition>

      {/* Pack Detail Dialog */}
      <Dialog
        open={!!viewPack}
        onClose={handleCloseView}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1a1721',
              border: '1px solid rgba(179, 136, 255, 0.15)',
              borderRadius: '20px',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pr: 1.5 }}>
          <Box>
            <Typography component="div" variant="subtitle1" sx={{ fontWeight: 800 }}>
              {viewPack?.title || 'Sticker Pack'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {stickerDetail ? `${stickerDetail.sticker_count} stickers` : 'Loading...'}
              </Typography>
              {viewPack && (
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                  · @{viewPack.botUsername}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={handleCloseView} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {viewLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={36} sx={{ color: '#b388ff' }} />
            </Box>
          )}

          {viewError && (
            <Alert severity="error" sx={{ fontSize: '0.8rem', mb: 2 }}>{viewError}</Alert>
          )}

          {stickerDetail && !viewLoading && (
            <Box>
              {/* Action buttons row */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {viewPack && isOwnPack(viewPack, botInfo?.username) && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                    onClick={() => { haptic('light'); handleCloseView(); router.push(`/edit?pack=${encodeURIComponent(viewPack?.name || '')}`) }}
                    sx={{ fontSize: '0.75rem', py: 0.75, bgcolor: 'rgba(105, 240, 174, 0.15)', border: '1px solid rgba(105, 240, 174, 0.3)', '&:hover': { bgcolor: 'rgba(105, 240, 174, 0.25)' } }}
                  >
                    Edit Pack
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                  onClick={() => { haptic('light'); handleCloseView(); router.push(`/add?pack=${encodeURIComponent(viewPack?.name || '')}`) }}
                  sx={{ fontSize: '0.75rem', py: 0.75, bgcolor: 'rgba(179, 136, 255, 0.15)', border: '1px solid rgba(179, 136, 255, 0.3)', '&:hover': { bgcolor: 'rgba(179, 136, 255, 0.25)' } }}
                >
                  Add Stickers
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                  onClick={() => { haptic('light'); handleCloseView(); router.push(`/result?link=${encodeURIComponent(viewPack?.link || '')}&name=${encodeURIComponent(viewPack?.name || '')}`) }}
                  sx={{ fontSize: '0.75rem', py: 0.75, borderColor: 'rgba(105, 240, 174, 0.3)', color: '#69f0ae', '&:hover': { borderColor: '#69f0ae', bgcolor: 'rgba(105, 240, 174, 0.05)' } }}
                >
                  Send
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SmartphoneIcon sx={{ fontSize: 16 }} />}
                  onClick={() => { haptic('light'); openTelegramApp(viewPack?.name || '') }}
                  sx={{ fontSize: '0.75rem', py: 0.75, borderColor: 'rgba(130, 234, 255, 0.3)', color: '#82eaff', '&:hover': { borderColor: '#82eaff' } }}
                >
                  Open
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AutoAwesomeMotionIcon sx={{ fontSize: 16 }} />}
                  onClick={() => { haptic('light'); handleCloseView(); router.push(`/remix?pack=${encodeURIComponent(viewPack?.name || '')}`) }}
                  sx={{ fontSize: '0.75rem', py: 0.75, borderColor: 'rgba(255, 64, 129, 0.3)', color: '#ff4081', '&:hover': { borderColor: '#ff4081', bgcolor: 'rgba(255, 64, 129, 0.05)' } }}
                >
                  Remix
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteForeverIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    haptic('medium')
                    if (viewPack) { handleCloseView(); handleDeleteClick(viewPack) }
                  }}
                  sx={{ fontSize: '0.75rem', py: 0.75, borderColor: 'rgba(255, 82, 82, 0.2)', color: '#ff867f', '&:hover': { borderColor: '#ff5252', bgcolor: 'rgba(255, 82, 82, 0.05)' } }}
                >
                  Delete
                </Button>
              </Box>

              {/* Pack link box */}
              <Box
                sx={{
                  bgcolor: 'rgba(21, 19, 31, 0.6)', borderRadius: '10px', py: 0.75, px: 1.25, mb: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                  border: '1px solid rgba(179, 136, 255, 0.08)',
                }}
              >
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#b388ff', wordBreak: 'break-all', textAlign: 'left', flex: 1 }}>
                  {viewPack?.link}
                </Typography>
                <Box
                  onClick={() => {
                    haptic('light')
                    if (viewPack) { copyToClipboard(viewPack.link); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) }
                  }}
                  sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: '#b388ff' }, flexShrink: 0 }}
                >
                  {copiedLink ? <CheckIcon sx={{ fontSize: 16, color: '#69f0ae' }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                </Box>
              </Box>

              {/* Sticker grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: 1.5,
                }}
              >
                {stickerDetail.stickers.map((sticker, i) => {
                   const token = getToken()
                   return (
                     <motion.div
                       key={i}
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ duration: 0.25, delay: i * 0.04, ease: [0.34, 1.56, 0.64, 1] }}
                     >
                       <Box
                         sx={{
                           display: 'flex', flexDirection: 'column', alignItems: 'center',
                           bgcolor: 'rgba(21, 19, 31, 0.5)',
                           border: '1px solid rgba(179, 136, 255, 0.08)',
                           borderRadius: '14px',
                           p: 1, gap: 0.5,
                           aspectRatio: '1',
                           justifyContent: 'center',
                           transition: 'all 0.2s',
                           '&:hover': { borderColor: 'rgba(179, 136, 255, 0.25)' },
                         }}
                       >
                        <StickerImage
                          filePath={sticker.file_path}
                          isVideo={sticker.is_video}
                          isAnimated={sticker.is_animated}
                          token={token}
                          packName={viewPack?.name || ''}
                          isUserMode={isUserLogin}
                          alt={`sticker ${i}`}
                          sx={{ maxWidth: '100%', maxHeight: '64px', borderRadius: '8px' }}
                        />
                         <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
                           {sticker.emoji || '—'}
                         </Typography>
                       </Box>
                     </motion.div>
                   )
                 })}
              </Box>

              {/* Pack info footer */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip
                  label={`Pack: ${viewPack?.name || ''}`}
                  size="small"
                  sx={{ fontSize: '0.62rem', height: 22, bgcolor: 'rgba(179, 136, 255, 0.08)', color: 'text.secondary', border: '1px solid rgba(179, 136, 255, 0.1)' }}
                />
                <Chip
                  label={`${stickerDetail.sticker_count} sticker${stickerDetail.sticker_count !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{ fontSize: '0.62rem', height: 22, bgcolor: 'rgba(105, 240, 174, 0.08)', color: '#69f0ae', border: '1px solid rgba(105, 240, 174, 0.1)' }}
                />
                <Chip
                  label={stickerDetail.sticker_type === 'regular' ? 'Regular' : stickerDetail.sticker_type}
                  size="small"
                  sx={{ fontSize: '0.62rem', height: 22, bgcolor: 'rgba(130, 234, 255, 0.08)', color: '#82eaff', border: '1px solid rgba(130, 234, 255, 0.1)' }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Existing Pack Dialog */}
      <Dialog
        open={showAddExisting}
        onClose={handleCloseAddExisting}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1a1721',
              border: '1px solid rgba(179, 136, 255, 0.15)',
              borderRadius: '20px',
            },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '16px', background: 'rgba(179, 136, 255, 0.1)', border: '1px solid rgba(179, 136, 255, 0.15)', mb: 1.5 }}>
            <SearchIcon sx={{ color: '#b388ff', fontSize: 24 }} />
          </Box>
          <Typography component="div" variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
            Import Existing Pack
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', mb: 2, textAlign: 'center' }}>
            Paste a pack link or name to preview and add it to your dashboard.
          </Typography>
          <TextField
            fullWidth
            value={existingPackName}
            onChange={(e) => { setExistingPackName(e.target.value); setExistingPackError(''); setExistingPackDetail(null); setExistingPackInfo(null) }}
            placeholder="e.g. https://t.me/addstickers/mypack_by_bot"
            size="small"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchExistingPack() }}
            sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          {existingPackError && <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.8rem' }}>{existingPackError}</Alert>}

          {existingPackLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={36} sx={{ color: '#b388ff' }} />
            </Box>
          )}

          {existingPackInfo && existingPackDetail && !existingPackLoading && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AutoAwesomeMotionIcon sx={{ color: '#b388ff', fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {existingPackInfo.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                    {existingPackInfo.sticker_count} stickers · {existingPackInfo.name}
                  </Typography>
                </Box>
                {(() => {
                  const match = existingPackInfo.name.match(/_by_(.+)$/)
                  const packBot = match ? match[1] : ''
                  const own = isUserLogin || (botInfo ? packBot.toLowerCase() === botInfo.username.toLowerCase() : false)
                  return own ? (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.62rem', fontWeight: 700, color: '#69f0ae', padding: '3px 8px', borderRadius: '8px', background: 'rgba(105, 240, 174, 0.1)', border: '1px solid rgba(105, 240, 174, 0.2)', flexShrink: 0 }}>
                      {isUserLogin ? <PersonIcon sx={{ fontSize: 10 }} /> : <SmartToyIcon sx={{ fontSize: 10 }} />} {isUserLogin ? 'Your Account' : 'Your Bot'}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.62rem', fontWeight: 700, color: '#ff4081', padding: '3px 8px', borderRadius: '8px', background: 'rgba(255, 64, 129, 0.1)', border: '1px solid rgba(255, 64, 129, 0.2)', flexShrink: 0 }}>
                      @{packBot}
                    </Box>
                  )
                })()}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                  gap: 1,
                  maxHeight: 280,
                  overflowY: 'auto',
                  p: 1,
                  bgcolor: 'rgba(21, 19, 31, 0.4)',
                  borderRadius: '14px',
                  border: '1px solid rgba(179, 136, 255, 0.06)',
                  mb: 2,
                }}
              >
                {existingPackDetail.stickers.map((sticker, i) => {
                  const t = getToken()
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
                          border: '1px solid rgba(179, 136, 255, 0.06)',
                          borderRadius: '10px',
                          p: 0.75, gap: 0.25,
                          aspectRatio: '1',
                          justifyContent: 'center',
                        }}
                      >
                        <StickerImage
                          filePath={sticker.file_path}
                          isVideo={sticker.is_video}
                          isAnimated={sticker.is_animated}
                          token={t}
                          packName={existingPackInfo.name}
                          isUserMode={isUserLogin}
                          alt={`sticker ${i}`}
                          sx={{ maxWidth: '100%', maxHeight: '48px', borderRadius: '6px' }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.58rem', color: 'text.disabled' }}>
                          {sticker.emoji || '—'}
                        </Typography>
                      </Box>
                    </motion.div>
                  )
                })}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => { setExistingPackDetail(null); setExistingPackInfo(null); setExistingPackName('') }}
                  sx={{ borderColor: 'rgba(179, 136, 255, 0.2)', '&:hover': { borderColor: 'rgba(179, 136, 255, 0.4)' }, fontSize: '0.78rem' }}
                >
                  Search Again
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleConfirmImport}
                  sx={{ borderColor: 'rgba(179, 136, 255, 0.2)', '&:hover': { borderColor: 'rgba(179, 136, 255, 0.4)' }, fontSize: '0.78rem' }}
                >
                  Add to Dashboard
                </Button>
              </Box>

              {(() => {
                const match = existingPackInfo.name.match(/_by_(.+)$/)
                const packBot = match ? match[1] : ''
                const own = isUserLogin || (botInfo ? packBot.toLowerCase() === botInfo.username.toLowerCase() : false)
                return own ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1, fontSize: '0.68rem' }}>
                      {isUserLogin ? "Full edit available — you can edit any pack you own" : "This is your bot's pack — full edit available"}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                        onClick={() => { haptic('light'); const n = existingPackInfo.name; handleCloseAddExisting(); router.push(`/edit?pack=${encodeURIComponent(n)}`) }}
                        sx={{ fontSize: '0.78rem', py: 1, bgcolor: 'rgba(105, 240, 174, 0.15)', border: '1px solid rgba(105, 240, 174, 0.3)', '&:hover': { bgcolor: 'rgba(105, 240, 174, 0.25)' } }}
                      >
                        Full Edit
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PlaylistAddIcon sx={{ fontSize: 16 }} />}
                        onClick={() => { haptic('light'); const n = existingPackInfo.name; handleCloseAddExisting(); router.push(`/add?pack=${encodeURIComponent(n)}`) }}
                        sx={{ fontSize: '0.78rem', py: 1, bgcolor: 'rgba(179, 136, 255, 0.15)', border: '1px solid rgba(179, 136, 255, 0.3)', '&:hover': { bgcolor: 'rgba(179, 136, 255, 0.25)' } }}
                      >
                        Add Stickers
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AutoFixHighIcon sx={{ fontSize: 16 }} />}
                        onClick={() => { haptic('light'); const n = existingPackInfo.name; handleCloseAddExisting(); router.push(`/remix?pack=${encodeURIComponent(n)}`) }}
                        sx={{ fontSize: '0.78rem', py: 1, borderColor: 'rgba(255, 64, 129, 0.3)', color: '#ff4081', '&:hover': { borderColor: '#ff4081', bgcolor: 'rgba(255, 64, 129, 0.05)' } }}
                      >
                        Remix
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1, fontSize: '0.68rem' }}>
                      Not your bot's pack — remix to create a new pack with these stickers
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AutoFixHighIcon sx={{ fontSize: 16 }} />}
                      onClick={() => { haptic('light'); const n = existingPackInfo.name; handleCloseAddExisting(); router.push(`/remix?pack=${encodeURIComponent(n)}`) }}
                      sx={{ fontSize: '0.82rem', py: 1.2, bgcolor: 'rgba(255, 64, 129, 0.15)', border: '1px solid rgba(255, 64, 129, 0.3)', color: '#ff4081', '&:hover': { bgcolor: 'rgba(255, 64, 129, 0.25)' } }}
                    >
                      Remix — Create New Pack
                    </Button>
                  </Box>
                )
              })()}
            </Box>
          )}

          {!existingPackInfo && !existingPackLoading && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCloseAddExisting}
                sx={{ borderColor: 'rgba(179, 136, 255, 0.2)', '&:hover': { borderColor: 'rgba(179, 136, 255, 0.4)' } }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearchExistingPack}
              >
                Search
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1a1721',
              border: '1px solid rgba(255, 82, 82, 0.15)',
              borderRadius: '20px',
            },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '16px', background: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.15)', mb: 1.5 }}>
            <DeleteForeverIcon sx={{ color: '#ff5252', fontSize: 24 }} />
          </Box>
          <Typography component="div" variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
            Delete Pack
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', mb: 2, textAlign: 'center' }}>
            <strong style={{ color: '#f5f0ff' }}>{deleteTarget?.title}</strong>
            <br />
            <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.74rem' }}>{deleteTarget?.name}</Box>
          </Typography>

          {deleteError && <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.8rem' }}>{deleteError}</Alert>}

          <Box
            onClick={() => { haptic('light'); setDeleteFromTelegram(!deleteFromTelegram) }}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              p: 1.25, mb: 2, borderRadius: '12px', cursor: 'pointer',
              bgcolor: deleteFromTelegram ? 'rgba(255, 82, 82, 0.08)' : 'rgba(21, 19, 31, 0.5)',
              border: `1px solid ${deleteFromTelegram ? 'rgba(255, 82, 82, 0.25)' : 'rgba(179, 136, 255, 0.1)'}`,
              transition: 'all 0.2s',
            }}
          >
            <Box sx={{
              width: 18, height: 18, borderRadius: '5px',
              border: deleteFromTelegram ? '2px solid #ff5252' : '2px solid rgba(179, 136, 255, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {deleteFromTelegram && <CheckIcon sx={{ fontSize: 12, color: '#ff5252' }} />}
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: deleteFromTelegram ? '#ff5252' : 'text.primary' }}>
                Also delete from Telegram
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block' }}>
                Permanently removes the pack from Telegram. This cannot be undone.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseDelete}
              disabled={deleteLoading}
              sx={{ borderColor: 'rgba(179, 136, 255, 0.2)', '&:hover': { borderColor: 'rgba(179, 136, 255, 0.4)' } }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              sx={{
                bgcolor: '#ff5252',
                '&:hover': { bgcolor: '#ff6b6b' },
                fontWeight: 700,
              }}
            >
              {deleteLoading ? <CircularProgress size={22} sx={{ color: 'inherit' }} /> : (deleteFromTelegram ? 'Delete Everywhere' : 'Remove')}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
