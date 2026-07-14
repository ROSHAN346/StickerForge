'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Container,
  Fade,
  Alert,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Collapse,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SecurityIcon from '@mui/icons-material/Security'
import PhoneIcon from '@mui/icons-material/Phone'
import LockIcon from '@mui/icons-material/Lock'
import KeyIcon from '@mui/icons-material/Key'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { motion } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import TokenInput from '@/components/TokenInput'
import {
  getToken, getBotInfo, setUserId, clearToken, BotInfoStorage, getUserId,
  getUserSession, getApiCreds, setLoginMethod, setUserSession, setApiCreds,
  LoginMethod, getLoginMethod, setUserInfo, getPacks, getPacksByUserId, getUniqueBots, SavedPack,
} from '@/lib/storage'
import { getTelegramUserId, haptic, hapticNotify } from '@/lib/telegram'
import { openTelegramLink } from '@/lib/links'
import { sendCode, signIn } from '@/lib/api'

type Step = 'userid' | 'bot' | 'phone' | 'code'
type LoginMode = 'bot' | 'user'

export default function HomePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('userid')
  const [mode, setMode] = useState<LoginMode>('bot')
  const [manualUserId, setManualUserId] = useState('')
  const [showIdHelp, setShowIdHelp] = useState(false)
  const [idError, setIdError] = useState('')

  // Phone login state
  const [apiId, setApiId] = useState('')
  const [apiHash, setApiHash] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [phoneCodeHash, setPhoneCodeHash] = useState('')
  const [tempSession, setTempSession] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [savedPacks, setSavedPacks] = useState<SavedPack[]>([])
  const [savedBots, setSavedBots] = useState<string[]>([])
  const [enteredUserId, setEnteredUserId] = useState<number | null>(null)

  useEffect(() => {
    const token = getToken()
    const info = getBotInfo()
    const uid = getTelegramUserId() || getUserId()
    const session = getUserSession()
    const method = getLoginMethod()

    const allPacks = getPacks()
    const allBots = [...new Set(allPacks.map((p) => p.botUsername))]

    if (method === 'user' && session) {
      router.push('/dashboard')
      return
    }
    if (token && info && uid) {
      router.push('/dashboard')
      return
    }

    setSavedPacks(allPacks)
    setSavedBots(allBots)

    if (uid && !token && !session) {
      setStep('bot')
      return
    }

    const tgUid = getTelegramUserId()
    if (tgUid) {
      setUserId(tgUid)
      setStep('bot')
    }
  }, [router])

  const handleUserIdSubmit = () => {
    const trimmed = manualUserId.trim()
    if (!trimmed || isNaN(Number(trimmed))) {
      setIdError('Enter a valid numeric Telegram ID')
      hapticNotify('error')
      return
    }
    haptic('medium')
    hapticNotify('success')
    const uid = Number(trimmed)
    setUserId(uid)
    setEnteredUserId(uid)
    const userPacks = getPacksByUserId(uid)
    setSavedPacks(userPacks.length > 0 ? userPacks : getPacks())
    setSavedBots(getUniqueBots(uid))
    setIdError('')
    setStep('bot')
  }

  const handleTokenSuccess = () => {
    hapticNotify('success')
    setLoginMethod('bot')
    router.push('/dashboard')
  }

  const handleSelectMode = (selectedMode: LoginMode) => {
    haptic('light')
    setMode(selectedMode)
    setPhoneError('')
    if (selectedMode === 'user') {
      setStep('phone')
    } else {
      setStep('bot')
    }
  }

  const handleSendCode = async () => {
    if (!apiId.trim() || !apiHash.trim() || !phone.trim()) {
      setPhoneError('Fill in API ID, API Hash, and phone number')
      hapticNotify('error')
      return
    }
    setPhoneLoading(true)
    setPhoneError('')
    try {
      const result = await sendCode(phone.trim(), Number(apiId.trim()), apiHash.trim())
      setPhoneCodeHash(result.phone_code_hash)
      setTempSession(result.session_string)
      setStep('code')
      hapticNotify('success')
    } catch (e) {
      setPhoneError(e instanceof Error ? e.message : 'Failed to send code')
      hapticNotify('error')
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!code.trim()) {
      setPhoneError('Enter the code Telegram sent you')
      hapticNotify('error')
      return
    }
    setPhoneLoading(true)
    setPhoneError('')
    try {
      const result = await signIn(
        phone.trim(),
        code.trim(),
        phoneCodeHash,
        tempSession,
        Number(apiId.trim()),
        apiHash.trim(),
        needs2FA ? password.trim() || undefined : undefined,
      )
      setUserSession(result.session_string)
      setUserId(result.user_id)
      setApiCreds(Number(apiId.trim()), apiHash.trim())
      setLoginMethod('user')
      setUserInfo({
        user_id: result.user_id,
        first_name: result.first_name,
        username: result.username,
        phone: result.phone,
      })
      hapticNotify('success')
      router.push('/dashboard')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to sign in'
      if (msg.includes('Two-factor') || msg.includes('password')) {
        setNeeds2FA(true)
        setPhoneError('Enter your Telegram password (2FA enabled)')
      } else {
        setPhoneError(msg)
      }
      hapticNotify('error')
    } finally {
      setPhoneLoading(false)
    }
  }

  const createBotSteps = [
    { icon: '1', title: 'Open @BotFather', desc: 'The official bot for creating bots', link: 'https://t.me/botfather' },
    { icon: '2', title: 'Send /newbot', desc: 'Choose a name & username for your bot' },
    { icon: '3', title: 'Copy the token', desc: 'BotFather replies with your token string' },
    { icon: '4', title: 'Paste it →', desc: 'Drop it in the login card on the right' },
  ]

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <PageTransition>
        <Box sx={{ display: 'flex', gap: 3, alignItems: { md: 'center' } }}>

          {/* LEFT SIDEBAR — Info */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            {/* Logo + title */}
            <Box sx={{ mb: 2 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Box
                  sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 56, height: 56, borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.15))',
                    mb: 1.5, border: '1px solid rgba(179, 136, 255, 0.15)',
                  }}
                >
                  <motion.div animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}>
                    <Typography sx={{ fontSize: 28 }}>🎨</Typography>
                  </motion.div>
                </Box>
              </motion.div>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.25 }}>
                <span className="gradient-text">Sticker Forge</span>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Turn pics, GIFs & clips into 🔥 Telegram sticker packs.
              </Typography>
            </Box>

            {/* Create a bot guide — only for bot mode */}
            {mode === 'bot' && (
              <Card sx={{ mb: 1.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <SmartToyIcon sx={{ color: '#b388ff', fontSize: 16 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b388ff', fontSize: '0.8rem' }}>
                      No bot? Create one 👇
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {createBotSteps.map((s, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: '6px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#b388ff' }}>
                          {s.icon}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', mb: 0.1 }}>
                            {s.link ? (
                              <Box component="span" onClick={() => openTelegramLink(s.link)} sx={{ color: '#b388ff', cursor: 'pointer', textDecoration: 'underline' }}>
                                {s.title}
                              </Box>
                            ) : s.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                            {s.desc}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* API setup guide — only for user mode */}
            {mode === 'user' && (
              <Card sx={{ mb: 1.5, border: '1px solid rgba(64, 196, 255, 0.08)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <KeyIcon sx={{ color: '#40c4ff', fontSize: 16 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#40c4ff', fontSize: '0.8rem' }}>
                      Get API credentials 👇
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '6px', background: 'rgba(64, 196, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#40c4ff' }}>1</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>
                          <Box component="span" onClick={() => window.open('https://my.telegram.org', '_blank')} sx={{ color: '#40c4ff', cursor: 'pointer', textDecoration: 'underline' }}>
                            Open my.telegram.org
                          </Box>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                          Log in with your phone number
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '6px', background: 'rgba(64, 196, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#40c4ff' }}>2</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>Go to API development tools</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                          Fill the form — any app name works
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '6px', background: 'rgba(64, 196, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#40c4ff' }}>3</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>Copy api_id and api_hash</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                          Paste them in the form on the right
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Security */}
            <Card sx={{ border: '1px solid rgba(105, 240, 174, 0.1)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SecurityIcon sx={{ color: '#69f0ae', fontSize: 16 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#69f0ae', fontSize: '0.8rem' }}>
                    Privacy & Security
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                    <strong style={{ color: '#69f0ae' }}>·</strong> sessionStorage only — gone when tab closes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                    <strong style={{ color: '#69f0ae' }}>·</strong> Backend uses in-memory, never persists
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                    <strong style={{ color: '#69f0ae' }}>·</strong> Disconnect anytime to wipe instantly
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* RIGHT MAIN */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {step === 'userid' ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
                  <Card sx={{ border: '1px solid rgba(64, 196, 255, 0.12)' }}>
                    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                        <Box sx={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 48, height: 48, borderRadius: '16px',
                          background: 'linear-gradient(135deg, rgba(64, 196, 255, 0.2), rgba(64, 196, 255, 0.05))',
                          border: '1px solid rgba(64, 196, 255, 0.15)',
                          mb: 1.5,
                        }}>
                          <PersonIcon sx={{ color: '#40c4ff', fontSize: 22 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
                          Enter your Telegram ID
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                          This is the account that will own the sticker packs
                        </Typography>
                      </Box>

                      <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, fontSize: '0.78rem' }}>
                          Send /start to your bot first! 🙏
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.74rem' }}>
                          Only needed for bot token login. Account login skips this.
                        </Typography>
                      </Alert>

                      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <TextField
                          fullWidth
                          value={manualUserId}
                          onChange={(e) => { setManualUserId(e.target.value); setIdError('') }}
                          placeholder="e.g. 123456789"
                          type="number"
                          error={!!idError}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PersonIcon sx={{ fontSize: 16, color: '#40c4ff' }} />
                                </InputAdornment>
                              ),
                            },
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleUserIdSubmit() }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <Box>
                          <button
                            onClick={handleUserIdSubmit}
                            style={{
                              height: '100%', paddingInline: '20px', paddingBlock: '8px',
                              borderRadius: '24px', border: 'none',
                              background: 'linear-gradient(135deg, #40c4ff, #69f0ae)',
                              color: '#003344', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                            }}
                          >
                            Next →
                          </button>
                        </Box>
                      </Box>

                      {idError && <Alert severity="error" sx={{ mb: 1.5 }}>{idError}</Alert>}

                      {/* ID help dropdown */}
                      <Box
                        onClick={() => { haptic('light'); setShowIdHelp(!showIdHelp) }}
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', py: 0.75, px: 1.25, borderRadius: '10px',
                          background: 'rgba(179, 136, 255, 0.06)', border: '1px solid rgba(179, 136, 255, 0.1)',
                          transition: 'all 0.2s',
                          '&:hover': { backgroundColor: 'rgba(179, 136, 255, 0.1)' },
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#b388ff' }}>
                          ❓ How to find your User ID
                        </Typography>
                        {showIdHelp ? <ExpandLessIcon sx={{ fontSize: 15, color: '#b388ff' }} /> : <ExpandMoreIcon sx={{ fontSize: 15, color: '#b388ff' }} />}
                      </Box>
                      <Collapse in={showIdHelp}>
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ p: 1.25, borderRadius: '10px', background: 'rgba(21, 19, 31, 0.5)', border: '1px solid rgba(179, 136, 255, 0.06)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#69f0ae', fontSize: '0.7rem', mb: 0.25, display: 'block' }}>
                              🟢 @userinfobot
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.74rem', mb: 0.75 }}>
                              Instantly replies with your ID.
                            </Typography>
                            <Box component="span" onClick={() => openTelegramLink('https://t.me/userinfobot')} sx={{ color: '#b388ff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, textDecoration: 'underline' }}>
                              Open →
                            </Box>
                          </Box>
                          <Box sx={{ p: 1.25, borderRadius: '10px', background: 'rgba(21, 19, 31, 0.5)', border: '1px solid rgba(179, 136, 255, 0.06)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#40c4ff', fontSize: '0.7rem', mb: 0.25, display: 'block' }}>
                              🔵 @getidsbot
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.74rem', mb: 0.75 }}>
                              Send any message, get ID back.
                            </Typography>
                            <Box component="span" onClick={() => openTelegramLink('https://t.me/getidsbot')} sx={{ color: '#b388ff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, textDecoration: 'underline' }}>
                              Open →
                            </Box>
                          </Box>
                        </Box>
                      </Collapse>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 2 }}>
                        <InfoOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                          Step 1 of 2 · Next: choose login method
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {savedPacks.length > 0 && (
                    <Card sx={{ mt: 2, border: '1px solid rgba(179, 136, 255, 0.08)', bgcolor: 'rgba(21, 19, 31, 0.4)' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <AutoAwesomeMotionIcon sx={{ color: '#b388ff', fontSize: 16 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b388ff', fontSize: '0.78rem' }}>
                            Your Sticker Packs ({savedPacks.length})
                          </Typography>
                        </Box>

                        {savedBots.length > 1 && (
                          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
                            {savedBots.map((bot) => (
                              <Box
                                key={bot}
                                onClick={() => { haptic('light') }}
                                sx={{
                                  display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                  fontSize: '0.66rem', fontWeight: 600, color: '#82eaff',
                                  padding: '3px 8px', borderRadius: '8px',
                                  background: 'rgba(130, 234, 255, 0.08)',
                                  border: '1px solid rgba(130, 234, 255, 0.12)',
                                }}
                              >
                                <SmartToyIcon sx={{ fontSize: 11 }} />
                                @{bot}
                              </Box>
                            ))}
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 200, overflowY: 'auto' }}>
                          {savedPacks.slice(0, 8).map((pack) => (
                            <Box
                              key={pack.name}
                              sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                py: 0.5, px: 1, borderRadius: '10px',
                                bgcolor: 'rgba(21, 19, 31, 0.5)',
                                border: '1px solid rgba(179, 136, 255, 0.05)',
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: 'rgba(179, 136, 255, 0.15)' },
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
                                <Typography sx={{ fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {pack.title}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                                  {pack.stickerCount} stickers · @{pack.botUsername}
                                </Typography>
                              </Box>
                              <Box
                                onClick={() => { haptic('light'); window.open(pack.link, '_blank') }}
                                sx={{ cursor: 'pointer', color: 'text.disabled', '&:hover': { color: '#b388ff' }, flexShrink: 0 }}
                              >
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </Box>
                            </Box>
                          ))}
                        </Box>

                        {savedPacks.length > 8 && (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.62rem' }}>
                            +{savedPacks.length - 8} more packs — login to see all
                          </Typography>
                        )}

                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.62rem' }}>
                          Enter your ID and login to edit, send, or manage these packs
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
                  {/* Back button bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <IconButton
                      onClick={() => { haptic('light'); setStep('userid'); setPhoneError(''); setCode(''); setNeeds2FA(false) }}
                      sx={{
                        color: 'text.secondary',
                        border: '1px solid rgba(64, 196, 255, 0.15)',
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        '&:hover': { color: '#40c4ff', borderColor: 'rgba(64, 196, 255, 0.35)', bgcolor: 'rgba(64, 196, 255, 0.06)' },
                      }}
                    >
                      <ArrowBackIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Change User ID
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.66rem' }}>
                        ID: {getUserId() || '—'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step indicator */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(105, 240, 174, 0.15)', border: '1px solid rgba(105, 240, 174, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#69f0ae' }}>
                      ✓
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#69f0ae', fontWeight: 600 }}>
                      User ID saved
                    </Typography>
                    <Box sx={{ width: 20, height: 2, background: 'rgba(179, 136, 255, 0.2)' }} />
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(179, 136, 255, 0.15)', border: '1px solid rgba(179, 136, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#b388ff' }}>
                      2
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#b388ff', fontWeight: 600 }}>
                      Login
                    </Typography>
                  </Box>

                  {/* Login method toggle */}
                  {(step === 'bot' || step === 'phone') && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Box
                        onClick={() => handleSelectMode('bot')}
                        sx={{
                          flex: 1, cursor: 'pointer', textAlign: 'center',
                          py: 1.5, borderRadius: '14px',
                          background: mode === 'bot' ? 'rgba(179, 136, 255, 0.12)' : 'rgba(21, 19, 31, 0.4)',
                          border: `1px solid ${mode === 'bot' ? 'rgba(179, 136, 255, 0.3)' : 'rgba(179, 136, 255, 0.08)'}`,
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: 'rgba(179, 136, 255, 0.25)' },
                        }}
                      >
                        <SmartToyIcon sx={{ color: mode === 'bot' ? '#b388ff' : 'text.disabled', fontSize: 20, mb: 0.25 }} />
                        <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: mode === 'bot' ? '#b388ff' : 'text.secondary' }}>
                          Bot Token
                        </Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
                          Needs /start
                        </Typography>
                      </Box>
                      <Box
                        onClick={() => handleSelectMode('user')}
                        sx={{
                          flex: 1, cursor: 'pointer', textAlign: 'center',
                          py: 1.5, borderRadius: '14px',
                          background: mode === 'user' ? 'rgba(64, 196, 255, 0.12)' : 'rgba(21, 19, 31, 0.4)',
                          border: `1px solid ${mode === 'user' ? 'rgba(64, 196, 255, 0.3)' : 'rgba(64, 196, 255, 0.08)'}`,
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: 'rgba(64, 196, 255, 0.25)' },
                        }}
                      >
                        <PersonIcon sx={{ color: mode === 'user' ? '#40c4ff' : 'text.disabled', fontSize: 20, mb: 0.25 }} />
                        <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: mode === 'user' ? '#40c4ff' : 'text.secondary' }}>
                          Telegram Account
                        </Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
                          No bot needed
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Existing packs for this user ID */}
                  {savedPacks.length > 0 && (step === 'bot' || step === 'phone') && (
                    <Card sx={{ mb: 2, border: '1px solid rgba(179, 136, 255, 0.08)', bgcolor: 'rgba(21, 19, 31, 0.4)' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <AutoAwesomeMotionIcon sx={{ color: '#b388ff', fontSize: 16 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b388ff', fontSize: '0.78rem' }}>
                            Your Sticker Packs ({savedPacks.length})
                          </Typography>
                        </Box>

                        {/* Bot filter chips */}
                        {savedBots.length > 1 && (
                          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
                            {savedBots.map((bot) => (
                              <Box
                                key={bot}
                                onClick={() => { haptic('light') }}
                                sx={{
                                  display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                  fontSize: '0.66rem', fontWeight: 600, color: '#82eaff',
                                  padding: '3px 8px', borderRadius: '8px',
                                  background: 'rgba(130, 234, 255, 0.08)',
                                  border: '1px solid rgba(130, 234, 255, 0.12)',
                                }}
                              >
                                <SmartToyIcon sx={{ fontSize: 11 }} />
                                @{bot}
                              </Box>
                            ))}
                          </Box>
                        )}

                        {/* Pack list */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 200, overflowY: 'auto' }}>
                          {savedPacks.slice(0, 8).map((pack, i) => (
                            <Box
                              key={pack.name}
                              sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                py: 0.5, px: 1, borderRadius: '10px',
                                bgcolor: 'rgba(21, 19, 31, 0.5)',
                                border: '1px solid rgba(179, 136, 255, 0.05)',
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: 'rgba(179, 136, 255, 0.15)' },
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
                                <Typography sx={{ fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {pack.title}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                                  {pack.stickerCount} stickers · @{pack.botUsername}
                                </Typography>
                              </Box>
                              <Box
                                onClick={() => { haptic('light'); window.open(pack.link, '_blank') }}
                                sx={{ cursor: 'pointer', color: 'text.disabled', '&:hover': { color: '#b388ff' }, flexShrink: 0 }}
                              >
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </Box>
                            </Box>
                          ))}
                        </Box>

                        {savedPacks.length > 8 && (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.62rem' }}>
                            +{savedPacks.length - 8} more packs — login to see all
                          </Typography>
                        )}

                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.62rem' }}>
                          Login to edit, send, or manage these packs
                        </Typography>
                      </CardContent>
                    </Card>
                  )}

                  {/* Bot token login */}
                  {step === 'bot' && (
                    <Box>
                      <TokenInput onSuccess={handleTokenSuccess} />
                    </Box>
                  )}

                  {/* Phone login — API credentials + phone */}
                  {step === 'phone' && (
                    <Card sx={{ border: '1px solid rgba(64, 196, 255, 0.12)' }}>
                      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
                            Login with Telegram
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                            No bot needed. Login as yourself.
                          </Typography>
                        </Box>

                        <TextField
                          fullWidth
                          value={apiId}
                          onChange={(e) => setApiId(e.target.value)}
                          placeholder="api_id (e.g. 1234567)"
                          type="number"
                          size="small"
                          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <TextField
                          fullWidth
                          value={apiHash}
                          onChange={(e) => setApiHash(e.target.value)}
                          placeholder="api_hash (e.g. abc123def456...)"
                          size="small"
                          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <TextField
                          fullWidth
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone (e.g. +1234567890)"
                          size="small"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon sx={{ fontSize: 16, color: '#40c4ff' }} />
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />

                        {phoneError && <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.78rem' }}>{phoneError}</Alert>}

                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          onClick={handleSendCode}
                          disabled={phoneLoading}
                          sx={{
                            py: 1.3, fontSize: '0.9rem',
                            background: 'linear-gradient(135deg, #40c4ff, #69f0ae)',
                            color: '#003344',
                            '&:hover': { background: 'linear-gradient(135deg, #38b8f5, #5be09a)' },
                          }}
                        >
                          {phoneLoading ? <CircularProgress size={22} sx={{ color: 'inherit' }} /> : 'Send Login Code →'}
                        </Button>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1.5 }}>
                          <LockIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                            Session-only · never stored on any server
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {/* Code input */}
                  {step === 'code' && (
                    <Card sx={{ border: '1px solid rgba(105, 240, 174, 0.15)' }}>
                      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 48, height: 48, borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(105, 240, 174, 0.2), rgba(64, 196, 255, 0.1))',
                            border: '1px solid rgba(105, 240, 174, 0.2)',
                            mb: 1.5,
                          }}>
                            <LockIcon sx={{ color: '#69f0ae', fontSize: 22 }} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
                            Enter the code
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                            We sent a login code to your Telegram app
                          </Typography>
                        </Box>

                        <TextField
                          fullWidth
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="Login code (e.g. 12345)"
                          size="small"
                          autoFocus
                          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSignIn() }}
                        />

                        {needs2FA && (
                          <TextField
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Telegram password (2FA)"
                            type="password"
                            size="small"
                            sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSignIn() }}
                          />
                        )}

                        {phoneError && <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.78rem' }}>{phoneError}</Alert>}

                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          onClick={handleSignIn}
                          disabled={phoneLoading}
                          sx={{
                            py: 1.3, fontSize: '0.9rem',
                            background: 'linear-gradient(135deg, #69f0ae, #40c4ff)',
                            color: '#003322',
                            '&:hover': { background: 'linear-gradient(135deg, #5be09a, #38b8f5)' },
                          }}
                        >
                          {phoneLoading ? <CircularProgress size={22} sx={{ color: 'inherit' }} /> : 'Sign In ✨'}
                        </Button>

                        <Box
                          onClick={() => { haptic('light'); setStep('phone'); setCode(''); setPhoneError('') }}
                          sx={{ mt: 1.5, textAlign: 'center', cursor: 'pointer', color: 'text.disabled', fontSize: '0.72rem', fontWeight: 600, '&:hover': { color: '#b388ff' } }}
                        >
                          ← Back
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              </motion.div>
            )}
          </Box>
        </Box>
      </PageTransition>
    </Container>
  )
}
