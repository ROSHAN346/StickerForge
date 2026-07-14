'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Typography, Container, Button, Card, CardContent, IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HomeIcon from '@mui/icons-material/Home'
import AddIcon from '@mui/icons-material/Add'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import TroubleshootIcon from '@mui/icons-material/Troubleshoot'
import SendIcon from '@mui/icons-material/Send'
import PageTransition from '@/components/PageTransition'
import ResultLink from '@/components/ResultLink'
import { haptic } from '@/lib/telegram'

function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [link, setLink] = useState('')
  const [packName, setPackName] = useState('')
  const [added, setAdded] = useState<number | null>(null)

  useEffect(() => {
    setLink(searchParams.get('link') || '')
    setPackName(searchParams.get('name') || '')
    const a = searchParams.get('added')
    setAdded(a ? Number(a) : null)
  }, [searchParams])

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 2 }}>
      <PageTransition>
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>

          {/* LEFT SIDEBAR — Info */}
          <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0, position: { md: 'sticky' }, top: { md: 16 } }}>
            {added !== null ? (
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.25 }}>
                <span className="gradient-text">Stickers Added!</span>
              </Typography>
            ) : (
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.25 }}>
                <span className="gradient-text">Pack Created!</span>
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
              {added !== null
                ? `${added} sticker${added !== 1 ? 's' : ''} added to your pack.`
                : 'Your pack is live. Here\'s how to use it.'}
            </Typography>

            {/* How to use */}
            <Card sx={{ mb: 1.5, border: '1px solid rgba(179, 136, 255, 0.08)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <LightbulbIcon sx={{ color: '#ffd93d', fontSize: 16 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffd93d', fontSize: '0.78rem' }}>
                    How to use 📖
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '6px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.55rem', fontWeight: 700, color: '#b388ff' }}>1</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.74rem', lineHeight: 1.45 }}>
                      Tap <strong style={{ color: '#f5f0ff' }}>Open App</strong> to launch Telegram and view the pack
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '6px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.55rem', fontWeight: 700, color: '#b388ff' }}>2</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.74rem', lineHeight: 1.45 }}>
                      Tap <strong style={{ color: '#f5f0ff' }}>Add Stickers</strong> on the pack page
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '6px', background: 'rgba(179, 136, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.55rem', fontWeight: 700, color: '#b388ff' }}>3</Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.74rem', lineHeight: 1.45 }}>
                      Stickers appear in your <strong style={{ color: '#f5f0ff' }}>emoji panel</strong> — ready to send
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Link not working? */}
            <Card sx={{ mb: 1.5, border: '1px solid rgba(255, 171, 64, 0.1)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TroubleshootIcon sx={{ color: '#ffab40', fontSize: 16 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffab40', fontSize: '0.78rem' }}>
                    Link not working? 🔧
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.74rem', lineHeight: 1.45 }}>
                    If the <strong style={{ color: '#f5f0ff' }}>Open App</strong> button doesn&apos;t redirect you:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: '#ffab40', mt: 0.5, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.4 }}>
                        Copy the link using the <Box component="span" sx={{ color: '#b388ff' }}>copy icon</Box>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: '#ffab40', mt: 0.5, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.4 }}>
                        Paste it in <strong style={{ color: '#f5f0ff' }}>any chat</strong> (Saved Messages, a friend, etc.)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: '#ffab40', mt: 0.5, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.4 }}>
                        Tap the link → pack opens → tap <strong style={{ color: '#f5f0ff' }}>Add Stickers</strong>
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Send directly */}
            <Card sx={{ border: '1px solid rgba(105, 240, 174, 0.08)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SendIcon sx={{ color: '#69f0ae', fontSize: 16 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#69f0ae', fontSize: '0.78rem' }}>
                    Send directly 📨
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.45 }}>
                  Use <strong style={{ color: '#f5f0ff' }}>Send to Me</strong> to get stickers in your bot chat instantly. Or enter any chat ID to send to others.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* RIGHT MAIN */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ maxWidth: 460, mx: 'auto' }}>
              {/* Top bar */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={() => { haptic('light'); router.push('/dashboard') }}
                    sx={{ borderColor: 'rgba(105, 240, 174, 0.2)', color: '#69f0ae', fontSize: '0.78rem', '&:hover': { borderColor: 'rgba(105, 240, 174, 0.4)' } }}
                  >
                    Home
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { haptic('light'); router.push('/create') }}
                    sx={{ fontSize: '0.78rem' }}
                  >
                    New
                  </Button>
                </Box>
              </Box>

              {link && <ResultLink link={link} packName={packName} added={added} />}
            </Box>
          </Box>
        </Box>
      </PageTransition>
    </Container>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Loading...</Typography></Box>}>
      <ResultContent />
    </Suspense>
  )
}
