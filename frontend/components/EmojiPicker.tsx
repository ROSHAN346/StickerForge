'use client'

import { useState } from 'react'
import { Box, Typography, Popper, Paper, ClickAwayListener } from '@mui/material'
import AddReactionIcon from '@mui/icons-material/AddReaction'
import { hapticSelect, haptic } from '@/lib/telegram'

const EMOJI_SET = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😉',
  '😊','😇','🥰','😍','🤩','😘','😋','😛','😜','🤪',
  '🤑','🤗','🤭','🤫','🤔','🤐','😐','😑','😶','😏',
  '😒','🙄','😬','🥺','🥹','😱','😨','😰','😥','😓',
  '🤗','🫡','🫠','🫥','❤️','🧡','💛','💚','💙','💜',
  '🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖',
  '💘','💝','🔥','⭐','🌟','✨','⚡','💯','✅','❌',
  '❓','❗','💬','👍','👎','👌','✌️','🤞','🤟','🤘',
  '👏','🙌','🤝','🙏','✊','👊','🤛','🤜','💪','🫵',
  '👋','🎉','🎊','🎈','🎁','🏆','🥇','🌈','☀️','🌙',
  '😎','🤓','🧐','🥳','🥸','🤠','😴','🤤','😪','😌',
  '😔','🥵','🥶','🤯','😳','😡','🤬','😤','😠','😢',
  '😭','😤','🥱','🤒','🤕','🤢','🤮','🥴','😵','🤥',
]

interface EmojiPickerProps {
  selected: string[]
  onChange: (emojis: string[]) => void
  index: number
}

export default function EmojiPicker({ selected, onChange, index }: EmojiPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const toggleEmoji = (emoji: string) => {
    hapticSelect()
    if (selected.includes(emoji)) {
      onChange(selected.filter((e) => e !== emoji))
    } else {
      if (selected.length >= 20) return
      onChange([...selected, emoji])
    }
  }

  return (
    <Box>
      <button
        onClick={(e) => { haptic('light'); setAnchorEl(e.currentTarget as unknown as HTMLElement) }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          paddingTop: '8px', paddingBottom: '8px', paddingLeft: '14px', paddingRight: '14px',
          borderRadius: '14px', border: '1px solid',
          borderColor: open ? '#b388ff' : 'rgba(179, 136, 255, 0.12)',
          backgroundColor: 'rgba(21, 19, 31, 0.5)', backdropFilter: 'blur(10px)',
          cursor: 'pointer', minHeight: '44px', minWidth: '130px',
          color: '#f5f0ff', transition: 'all 0.25s', fontFamily: 'inherit', fontSize: 'inherit',
        }}
      >
        {selected.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {selected.slice(0, 5).map((e, i) => (
              <Typography key={i} sx={{ fontSize: '1.15rem' }}>{e}</Typography>
            ))}
            {selected.length > 5 && (
              <Typography variant="caption" color="text.secondary">+{selected.length - 5}</Typography>
            )}
          </Box>
        ) : (
          <>
            <AddReactionIcon sx={{ fontSize: 18, color: '#b388ff' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Pick emoji</Typography>
          </>
        )}
      </button>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        sx={{ zIndex: 1300, width: 340 }}
      >
        <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
          <Paper
            sx={{
              p: 2, borderRadius: '24px', maxHeight: 300, overflowY: 'auto',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(179, 136, 255, 0.1)',
              background: 'rgba(15, 13, 22, 0.95)', backdropFilter: 'blur(30px)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block', fontWeight: 600 }}>
              Sticker {index + 1} — {selected.length}/20 picked 😎
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.5 }}>
              {EMOJI_SET.map((emoji, i) => {
                const isSelected = selected.includes(emoji)
                return (
                  <button
                    key={i}
                    onClick={() => toggleEmoji(emoji)}
                    style={{
                      width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(179, 136, 255, 0.2)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.3)'; e.currentTarget.style.backgroundColor = isSelected ? 'rgba(179, 136, 255, 0.25)' : 'rgba(179, 136, 255, 0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = isSelected ? 'rgba(179, 136, 255, 0.2)' : 'transparent' }}
                  >
                    {emoji}
                  </button>
                )
              })}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  )
}
