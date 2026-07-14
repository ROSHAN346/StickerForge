'use client'

import { Box } from '@mui/material'

export default function AnimatedBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(179, 136, 255, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobFloat1 20s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '55vw',
          height: '55vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 64, 129, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobFloat2 25s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '35vw',
          height: '35vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(64, 196, 255, 0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'blobFloat3 30s ease-in-out infinite',
        }}
      />
    </Box>
  )
}
