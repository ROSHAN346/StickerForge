'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, Button, Typography } from '@mui/material'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import { initTelegramWebApp, getTelegramWebApp, isInsideTelegram, haptic, hapticNotify } from '@/lib/telegram'
import { clearAll, getToken, getUserSession } from '@/lib/storage'
import AnimatedBackground from './AnimatedBackground'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  useEffect(() => {
    setMounted(true)
    initTelegramWebApp()
  }, [])

  useEffect(() => {
    const tg = getTelegramWebApp()
    if (!tg) return

    if (pathname !== '/') {
      tg.BackButton.show()
      tg.BackButton.onClick(() => router.back())
    } else {
      tg.BackButton.hide()
    }

    return () => {
      tg.BackButton.offClick(() => router.back())
    }
  }, [pathname, router])

  if (!mounted) return null

  const inTg = isInsideTelegram()
  const hasSession = getToken() || getUserSession()
  const showButton = pathname !== '/' && hasSession

  const handleLogout = () => {
    haptic('medium')
    hapticNotify('warning')
    clearAll()
    setShowLogout(false)
    router.push('/')
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AnimatedBackground />

      {/* Floating logout button */}
      {showButton && (
        <Tooltip title="Disconnect & clear session" placement="left">
          <IconButton
            onClick={() => { haptic('light'); setShowLogout(true) }}
            sx={{
              position: 'fixed',
              top: 12,
              right: 12,
              zIndex: 1300,
              color: 'text.secondary',
              border: '1px solid rgba(255, 82, 82, 0.15)',
              borderRadius: '12px',
              bgcolor: 'rgba(21, 19, 31, 0.7)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
              '&:hover': {
                color: '#ff5252',
                borderColor: 'rgba(255, 82, 82, 0.4)',
                bgcolor: 'rgba(255, 82, 82, 0.08)',
              },
            }}
          >
            <PowerSettingsNewIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}

      <Box sx={{ flex: 1, pt: 1.5, pb: inTg ? 8 : 2, position: 'relative', zIndex: 1 }}>
        {children}
      </Box>

      {/* Logout confirmation dialog */}
      <Dialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
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
            <PowerSettingsNewIcon sx={{ color: '#ff5252', fontSize: 24 }} />
          </Box>
          <Typography component="div" variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
            Disconnect?
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', mb: 2.5, lineHeight: 1.5 }}>
            This will wipe your bot token, user ID, and all saved packs from this browser. You&apos;ll need to log in again.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => { haptic('light'); setShowLogout(false) }}
              sx={{ borderColor: 'rgba(179, 136, 255, 0.2)', '&:hover': { borderColor: 'rgba(179, 136, 255, 0.4)' } }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogout}
              sx={{
                bgcolor: '#ff5252',
                '&:hover': { bgcolor: '#ff6b6b' },
                fontWeight: 700,
              }}
            >
              Disconnect
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
