'use client'

import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Fade,
  Card,
  CardContent,
  Collapse,
  Divider,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import LockIcon from '@mui/icons-material/Lock'
import { verifyToken } from '@/lib/api'
import { setToken, setBotInfo, setUserId } from '@/lib/storage'
import { haptic, hapticNotify, getTelegramUserId } from '@/lib/telegram'

interface TokenInputProps {
  onSuccess: () => void
}

export default function TokenInput({ onSuccess }: TokenInputProps) {
  const [token, setTokenState] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSafety, setShowSafety] = useState(false)

  const handleSubmit = async () => {
    if (!token.trim()) { setError('Paste your bot token first! 🙏'); return }
    setLoading(true); setError('')
    try {
      const info = await verifyToken(token.trim())
      setToken(token.trim())
      setBotInfo(info)
      const tgUserId = getTelegramUserId()
      if (tgUserId) setUserId(tgUserId)
      hapticNotify('success')
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That token ain\'t it 😬')
      hapticNotify('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
      <Fade in timeout={500}>
        <Box>
          {/* Login card */}
          <Card sx={{ border: '1px solid rgba(179, 136, 255, 0.12)' }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 48, height: 48, borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 64, 129, 0.1))',
                  border: '1px solid rgba(179, 136, 255, 0.15)',
                  mb: 1.5,
                }}>
                  <LockIcon sx={{ color: '#b388ff', fontSize: 22 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
                  Connect your bot
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                  Paste your bot token to start creating stickers
                </Typography>
              </Box>

              <TextField
                fullWidth
                type={show ? 'text' : 'password'}
                value={token}
                onChange={(e) => setTokenState(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                error={!!error}
                disabled={loading}
                multiline
                minRows={2}
                maxRows={3}
                sx={{ mb: 1.5 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShow(!show)} edge="end" size="small">
                          {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
                }}
              />
              {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading || !token.trim()}
                sx={{ py: 1.3, fontSize: '0.95rem' }}
              >
                {loading ? 'Connecting... 🔄' : 'Connect Bot ✨'}
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1.5 }}>
                <LockIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                  Session-only · never stored on any server
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Safety dropdown */}
          <Box
            onClick={() => { haptic('light'); setShowSafety(!showSafety) }}
            sx={{
              mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', py: 1, px: 1.5, borderRadius: '12px',
              background: 'rgba(255, 217, 61, 0.05)', border: '1px solid rgba(255, 217, 61, 0.08)',
              transition: 'all 0.2s',
              '&:hover': { backgroundColor: 'rgba(255, 217, 61, 0.08)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon sx={{ color: '#ffd93d', fontSize: 15 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffd93d', fontSize: '0.72rem' }}>
                ⚠️ Safety tips before connecting
              </Typography>
            </Box>
            {showSafety ? <ExpandLessIcon sx={{ fontSize: 16, color: '#ffd93d' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#ffd93d' }} />}
          </Box>
          <Collapse in={showSafety}>
            <Card sx={{ mt: 1, border: '1px solid rgba(255, 217, 61, 0.08)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '6px', background: 'rgba(255, 217, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#ffd93d' }}>!</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                      <strong style={{ color: '#f5f0ff' }}>Use a dedicated bot</strong> — don&apos;t paste your main bot&apos;s token
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '6px', background: 'rgba(255, 82, 82, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#ff867f' }}>!</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                      <strong style={{ color: '#f5f0ff' }}>Never share it</strong> — gives full control over your bot
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '6px', background: 'rgba(255, 217, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#ffd93d' }}>!</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                      <strong style={{ color: '#f5f0ff' }}>Use HTTPS</strong> — http:// exposes your token in transit
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '6px', background: 'rgba(255, 217, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#ffd93d' }}>!</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                      <strong style={{ color: '#f5f0ff' }}>Regenerate anytime</strong> — send <Box component="span" sx={{ fontFamily: 'monospace', color: '#ffd93d', fontSize: '0.72rem' }}>/revoke</Box> to @BotFather
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255, 217, 61, 0.06)' }} />
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '6px', background: 'rgba(105, 240, 174, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#69f0ae' }}>✓</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                      <strong style={{ color: '#f5f0ff' }}>Auto-wiped</strong> — cleared when you close the tab or disconnect
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Collapse>
        </Box>
      </Fade>
    </Box>
  )
}
