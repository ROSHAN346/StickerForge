'use client'

import { Box, Button, Typography, Card, CardContent, Divider, TextField, Alert, Collapse, IconButton, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LanguageIcon from '@mui/icons-material/Language'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import ShareIcon from '@mui/icons-material/Share'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import CircularProgress from '@mui/material/CircularProgress'
import LinkIcon from '@mui/icons-material/Link'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { haptic, hapticNotify, getTelegramUserId } from '@/lib/telegram'
import { openTelegramApp, openTelegramWeb, copyToClipboard, openTelegramLink } from '@/lib/links'
import { shareStickerPack, shareStickerPackAsUser } from '@/lib/api'
import { getToken, getUserId, getBotInfo, getUserSession, getApiCreds, getLoginMethod } from '@/lib/storage'

interface ResultLinkProps {
  link: string
  packName: string
  added?: number | null
}

export default function ResultLink({ link, packName, added }: ResultLinkProps) {
  const [copied, setCopied] = useState(false)
  const [chatIdInput, setChatIdInput] = useState('')
  const [sendLinkToo, setSendLinkToo] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState('')
  const [shareSuccess, setShareSuccess] = useState('')
  const [botNotStarted, setBotNotStarted] = useState(false)
  const [chatNotFound, setChatNotFound] = useState(false)
  const [copiedBot, setCopiedBot] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const handleCopy = (text: string) => {
    haptic('light')
    if (copyToClipboard(text)) {
      setCopied(true)
      hapticNotify('success')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendToMe = async () => {
    const myId = getTelegramUserId() || getUserId()
    if (!myId) {
      setShareError('Could not detect your Telegram ID. Enter a chat ID manually below.')
      hapticNotify('error')
      return
    }
    await doShare(myId)
  }

  const handleSendToChatId = async () => {
    const id = Number(chatIdInput.trim())
    if (!id || isNaN(id)) {
      setShareError('Enter a valid numeric chat ID.')
      hapticNotify('error')
      return
    }
    await doShare(id)
  }

  const doShare = async (chatId: number) => {
    const loginMethod = getLoginMethod()
    setSharing(true)
    setShareError('')
    setShareSuccess('')
    setBotNotStarted(false)
    setChatNotFound(false)
    try {
      let result
      if (loginMethod === 'user') {
        const session = getUserSession()
        const creds = getApiCreds()
        if (!session || !creds) {
          setShareError('Session not found. Please reconnect.')
          hapticNotify('error')
          return
        }
        result = await shareStickerPackAsUser(session, creds.apiId, creds.apiHash, chatId, packName)
      } else {
        const token = getToken()
        if (!token) {
          setShareError('Bot token not found. Please reconnect.')
          hapticNotify('error')
          return
        }
        result = await shareStickerPack(token, chatId, packName, sendLinkToo)
      }
      hapticNotify('success')
      setShareSuccess(result.message)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send stickers'
      setShareError(msg)
      if (msg.toLowerCase().includes("hasn't started") || msg.toLowerCase().includes('/start') || msg.toLowerCase().includes('forbidden')) {
        setBotNotStarted(true)
      }
      if (msg.toLowerCase().includes('chat not found') || msg.toLowerCase().includes('chat_id') || msg.toLowerCase().includes('user not found')) {
        setChatNotFound(true)
      }
      hapticNotify('error')
    } finally {
      setSharing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Card sx={{ border: '1px solid rgba(105, 240, 174, 0.2)', boxShadow: '0 0 30px rgba(105, 240, 174, 0.08)' }}>
        <CardContent sx={{ textAlign: 'center', py: 2.5, px: 2.5 }}>
          {/* Compact header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
            <CheckCircleIcon sx={{ fontSize: 28, color: '#69f0ae' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {added !== null ? `${added} Added! 🎉` : 'Pack Created! 🎉'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.78rem' }}>
            {packName}
          </Typography>

          {/* Open buttons — side by side */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              size="medium"
              startIcon={<SmartphoneIcon />}
              onClick={() => openTelegramApp(packName)}
              sx={{ py: 1, fontSize: '0.82rem' }}
            >
              Open App
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              startIcon={<LanguageIcon />}
              onClick={() => openTelegramWeb(packName)}
              sx={{ py: 1, fontSize: '0.82rem' }}
            >
              Open Web
            </Button>
          </Box>

          {/* Compact link box */}
          <Box
            sx={{
              bgcolor: 'rgba(21, 19, 31, 0.6)', borderRadius: '10px', py: 0.75, px: 1.25, mb: 1.5,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
              border: '1px solid rgba(179, 136, 255, 0.08)',
            }}
          >
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#b388ff', wordBreak: 'break-all', textAlign: 'left', flex: 1 }}>
              {link}
            </Typography>
            <Box onClick={() => handleCopy(link)} sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: '#b388ff' }, flexShrink: 0 }}>
              {copied ? <CheckCircleIcon sx={{ fontSize: 16, color: '#69f0ae' }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
            </Box>
          </Box>

          {copied && (
            <Typography variant="caption" sx={{ color: '#69f0ae', fontWeight: 600, fontSize: '0.68rem', display: 'block', mb: 1 }}>
              ✅ Link copied! Paste in Telegram to install.
            </Typography>
          )}

          {/* Share section — compact */}
          <Divider sx={{ borderColor: 'rgba(179, 136, 255, 0.08)', mb: 1.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
              send stickers directly
            </Typography>
          </Divider>

          {/* Share + Send to Me — side by side */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              startIcon={<ShareIcon />}
              onClick={() => { haptic('light'); openTelegramLink(link) }}
              sx={{ py: 1, fontSize: '0.78rem', borderColor: 'rgba(130, 234, 255, 0.3)', color: '#82eaff', '&:hover': { borderColor: '#82eaff' } }}
            >
              Share
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="medium"
              startIcon={sharing ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <PersonIcon />}
              onClick={handleSendToMe}
              disabled={sharing}
              sx={{
                py: 1, fontSize: '0.78rem', color: '#003322',
                background: 'linear-gradient(135deg, #69f0ae, #40c4ff)',
                border: '1px solid rgba(105, 240, 174, 0.5)',
                '&:hover': { background: 'linear-gradient(135deg, #5be09a, #38b8f5)' },
              }}
            >
              {sharing ? 'Sending...' : 'Send to Me'}
            </Button>
          </Box>

          {/* Chat ID input — single line with toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={chatIdInput}
              onChange={(e) => { setChatIdInput(e.target.value); setShareError(''); setShareSuccess('') }}
              placeholder="Chat ID (e.g. 123456789)"
              disabled={sharing}
              type="number"
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.75rem', borderRadius: '10px' } }}
            />
            <Tooltip title="Send stickers">
              <IconButton
                onClick={handleSendToChatId}
                disabled={sharing || !chatIdInput.trim()}
                size="small"
                sx={{ color: '#b388ff', border: '1px solid rgba(179, 136, 255, 0.2)', borderRadius: '10px', '&:hover': { bgcolor: 'rgba(179, 136, 255, 0.08)' }, '&.Mui-disabled': { color: 'text.disabled' } }}
              >
                {sharing ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <SendIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Toggle + help — single row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box
              onClick={() => { setSendLinkToo(!sendLinkToo); haptic('light') }}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', userSelect: 'none' }}
            >
              <Box sx={{
                width: 30, height: 16, borderRadius: '8px',
                background: sendLinkToo ? 'rgba(105, 240, 174, 0.3)' : 'rgba(179, 136, 255, 0.1)',
                border: `1px solid ${sendLinkToo ? 'rgba(105, 240, 174, 0.4)' : 'rgba(179, 136, 255, 0.15)'}`,
                position: 'relative', transition: 'all 0.2s',
              }}>
                <Box sx={{
                  position: 'absolute', top: 1, left: sendLinkToo ? 15 : 1,
                  width: 12, height: 12, borderRadius: '50%',
                  bgcolor: sendLinkToo ? '#69f0ae' : '#b388ff', transition: 'all 0.2s',
                }} />
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: sendLinkToo ? '#69f0ae' : 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <LinkIcon sx={{ fontSize: 11 }} /> Also send link
              </Typography>
            </Box>
            <Box
              onClick={() => { haptic('light'); setShowHelp(!showHelp) }}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.25, cursor: 'pointer', color: 'text.disabled', '&:hover': { color: '#b388ff' } }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Help</Typography>
            </Box>
          </Box>

          {/* Collapsible help */}
          <Collapse in={showHelp}>
            <Box sx={{ bgcolor: 'rgba(21, 19, 31, 0.4)', borderRadius: '10px', p: 1.25, mb: 1, border: '1px solid rgba(179, 136, 255, 0.05)' }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', display: 'block', lineHeight: 1.45, textAlign: 'left' }}>
                Recipient must send <Box component="span" sx={{ color: '#b388ff', fontWeight: 600 }}>/start</Box> to your bot first.
                Find chat ID via <Box component="span" sx={{ color: '#82eaff', fontWeight: 600 }}>@userinfobot</Box>.
              </Typography>
            </Box>
          </Collapse>

          {/* Error / success */}
          <Collapse in={!!shareError && !chatNotFound}>
            <Alert severity="error" sx={{ mb: 1, fontSize: '0.75rem', '& .MuiAlert-icon': { fontSize: 16 } }}>
              {shareError}
            </Alert>
          </Collapse>
          <Collapse in={!!shareSuccess}>
            <Alert severity="success" sx={{ mb: 1, fontSize: '0.75rem', '& .MuiAlert-icon': { fontSize: 16 } }}>
              {shareSuccess}
            </Alert>
          </Collapse>

          {/* Bot not started warning */}
          {botNotStarted && (() => {
            const bi = getBotInfo()
            if (!bi) return null
            return (
              <Alert severity="warning" sx={{ mb: 1, '& .MuiAlert-icon': { color: '#ffd93d' } }}>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '0.78rem' }}>
                  Start your bot first! 🙏
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                      color: copiedBot ? '#69f0ae' : '#b388ff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '8px',
                      background: copiedBot ? 'rgba(105, 240, 174, 0.1)' : 'rgba(179, 136, 255, 0.1)',
                      border: `1px solid ${copiedBot ? 'rgba(105, 240, 174, 0.25)' : 'rgba(179, 136, 255, 0.25)'}`,
                    }}
                  >
                    {copiedBot ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : <ContentCopyIcon sx={{ fontSize: 13 }} />}
                    {copiedBot ? 'Copied!' : `Copy @${bi.username}`}
                  </Box>
                  <Box
                    onClick={() => { haptic('light'); window.open(`https://t.me/${bi.username}`, '_blank') }}
                    sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.5,
                      color: '#ffd93d', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '8px',
                      background: 'rgba(255, 217, 61, 0.1)',
                      border: '1px solid rgba(255, 217, 61, 0.25)',
                    }}
                  >
                    Open in Telegram →
                  </Box>
                </Box>
              </Alert>
            )
          })()}

          {/* Chat not found warning */}
          {chatNotFound && (
            <Alert severity="warning" sx={{ mb: 1, '& .MuiAlert-icon': { color: '#ffab40' } }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '0.78rem' }}>
                Chat ID not found 😕
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.45, mb: 1.5, display: 'block' }}>
                The bot can&apos;t find a chat with that ID. Here&apos;s how to fix it:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '5px', background: 'rgba(255, 171, 64, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.55rem', fontWeight: 700, color: '#ffab40' }}>1</Box>
                  <Typography color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                    Ask the recipient to send <Box component="span" sx={{ color: '#b388ff', fontWeight: 600 }}>/start</Box> to your bot — bots can&apos;t message users who haven&apos;t started them
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '5px', background: 'rgba(255, 171, 64, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.55rem', fontWeight: 700, color: '#ffab40' }}>2</Box>
                  <Typography color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                    Verify the ID is correct — use <Box component="span" onClick={() => window.open('https://t.me/userinfobot', '_blank')} sx={{ color: '#82eaff', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>@userinfobot</Box> to get the exact numeric ID
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '5px', background: 'rgba(255, 171, 64, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.55rem', fontWeight: 700, color: '#ffab40' }}>3</Box>
                  <Typography color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
                    For groups, use the negative group ID (e.g. <Box component="span" sx={{ fontFamily: 'monospace', color: '#ffab40' }}>-100123456789</Box>)
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Box
                  onClick={() => { haptic('light'); window.open('https://t.me/userinfobot', '_blank') }}
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    color: '#82eaff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                    padding: '4px 10px', borderRadius: '8px',
                    background: 'rgba(130, 234, 255, 0.1)',
                    border: '1px solid rgba(130, 234, 255, 0.25)',
                  }}
                >
                  Open @userinfobot →
                </Box>
                {(() => {
                  const bi = getBotInfo()
                  if (!bi) return null
                  return (
                    <Box
                      onClick={() => { haptic('light'); window.open(`https://t.me/${bi.username}`, '_blank') }}
                      sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.5,
                        color: '#ffd93d', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                        padding: '4px 10px', borderRadius: '8px',
                        background: 'rgba(255, 217, 61, 0.1)',
                        border: '1px solid rgba(255, 217, 61, 0.25)',
                      }}
                    >
                      Start your bot →
                    </Box>
                  )
                })()}
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
