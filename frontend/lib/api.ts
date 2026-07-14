const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

function normalizePackName(raw: string): string {
  let name = raw.trim()
  if (name.includes('t.me/addstickers/')) name = name.split('t.me/addstickers/').pop() || name
  if (name.includes('telegram.org/addstickers/')) name = name.split('telegram.org/addstickers/').pop() || name
  if (name.startsWith('https://')) name = name.split('/').pop() || name
  return name.replace(/^\/+/, '')
}

export interface BotInfo {
  id: number
  username: string
  first_name: string
  can_join_groups: boolean
}

export interface CreatePackResult {
  success: boolean
  pack_name: string
  pack_link: string
  message: string
}

export interface AddStickersResult {
  success: boolean
  pack_link: string
  stickers_added: number
  message: string
}

export interface ShareStickerResult {
  success: boolean
  stickers_sent: number
  pack_link: string
  message: string
}

export interface StickerSetInfo {
  name: string
  title: string
  sticker_type: string
  sticker_count: number
}

export interface StickerItem {
  file_id: string
  emoji: string
  is_video: boolean
  is_animated: boolean
  width: number
  height: number
  file_path: string
}

export interface StickerSetDetail {
  name: string
  title: string
  sticker_type: string
  sticker_count: number
  stickers: StickerItem[]
}

export async function verifyToken(token: string): Promise<BotInfo> {
  const resp = await fetch(`${API_BASE}/api/verify-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to verify token' }))
    throw new Error(data.detail || 'Invalid bot token')
  }
  return resp.json()
}

export async function createStickerPack(
  token: string,
  userId: number,
  title: string,
  botUsername: string,
  files: File[],
  emojiLists: string[][],
): Promise<CreatePackResult> {
  const formData = new FormData()
  formData.append('token', token)
  formData.append('user_id', String(userId))
  formData.append('title', title)
  formData.append('bot_username', botUsername)
  formData.append('emoji_lists', JSON.stringify(emojiLists))
  files.forEach((file) => formData.append('files', file))

  const resp = await fetch(`${API_BASE}/api/stickers/create`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to create pack' }))
    throw new Error(data.detail || 'Failed to create sticker pack')
  }
  return resp.json()
}

export async function addStickersToPack(
  token: string,
  userId: number,
  packName: string,
  files: File[],
  emojiLists: string[][],
): Promise<AddStickersResult> {
  const formData = new FormData()
  formData.append('token', token)
  formData.append('user_id', String(userId))
  formData.append('pack_name', normalizePackName(packName))
  formData.append('emoji_lists', JSON.stringify(emojiLists))
  files.forEach((file) => formData.append('files', file))

  const resp = await fetch(`${API_BASE}/api/stickers/add`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to add stickers' }))
    throw new Error(data.detail || 'Failed to add stickers')
  }
  return resp.json()
}

export async function getStickerSetInfo(
  token: string,
  name: string,
): Promise<StickerSetInfo> {
  const resp = await fetch(`${API_BASE}/api/sticker-set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, name: normalizePackName(name) }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Pack not found' }))
    throw new Error(data.detail || 'Sticker pack not found')
  }
  return resp.json()
}

export async function shareStickerPack(
  token: string,
  chatId: number,
  packName: string,
  sendLink: boolean = false,
): Promise<ShareStickerResult> {
  const formData = new FormData()
  formData.append('token', token)
  formData.append('chat_id', String(chatId))
  formData.append('pack_name', normalizePackName(packName))
  formData.append('send_link', String(sendLink))

  const resp = await fetch(`${API_BASE}/api/stickers/share`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to share stickers' }))
    throw new Error(data.detail || 'Failed to share stickers')
  }
  return resp.json()
}

export async function getStickerSetDetail(
  token: string,
  name: string,
): Promise<StickerSetDetail> {
  const resp = await fetch(`${API_BASE}/api/stickers/detail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, name: normalizePackName(name) }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to load stickers' }))
    throw new Error(data.detail || 'Failed to load sticker details')
  }
  return resp.json()
}

export interface DeletePackResult {
  success: boolean
  pack_name: string
  message: string
}

export async function deleteStickerPack(
  token: string,
  name: string,
): Promise<DeletePackResult> {
  const resp = await fetch(`${API_BASE}/api/stickers/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, name: normalizePackName(name) }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to delete pack' }))
    throw new Error(data.detail || 'Failed to delete sticker pack')
  }
  return resp.json()
}

export async function deleteStickerFromPack(
  token: string,
  stickerFileId: string,
): Promise<{ success: boolean; message: string }> {
  const resp = await fetch(`${API_BASE}/api/stickers/delete-sticker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, sticker: stickerFileId }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to delete sticker' }))
    throw new Error(data.detail || 'Failed to delete sticker')
  }
  return resp.json()
}

export async function updateStickerEmoji(
  token: string,
  stickerFileId: string,
  emojiList: string[],
): Promise<{ success: boolean; message: string }> {
  const resp = await fetch(`${API_BASE}/api/stickers/update-emoji`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, sticker: stickerFileId, emoji_list: emojiList }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to update emoji' }))
    throw new Error(data.detail || 'Failed to update emoji')
  }
  return resp.json()
}

export async function reorderSticker(
  token: string,
  stickerFileId: string,
  position: number,
): Promise<{ success: boolean; message: string }> {
  const resp = await fetch(`${API_BASE}/api/stickers/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, sticker: stickerFileId, position }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to reorder sticker' }))
    throw new Error(data.detail || 'Failed to reorder sticker')
  }
  return resp.json()
}

export async function remixStickerPack(
  token: string,
  userId: number,
  sourcePackName: string,
  newTitle: string,
  botUsername: string,
  selectedStickers: { index: number; emoji: string }[],
  files: File[],
  emojiLists: string[][],
): Promise<CreatePackResult> {
  const formData = new FormData()
  formData.append('token', token)
  formData.append('user_id', String(userId))
  formData.append('source_pack_name', normalizePackName(sourcePackName))
  formData.append('new_title', newTitle)
  formData.append('bot_username', botUsername)
  formData.append('selected_stickers', JSON.stringify(selectedStickers))
  formData.append('emoji_lists', JSON.stringify(emojiLists))
  files.forEach((file) => formData.append('files', file))

  const resp = await fetch(`${API_BASE}/api/stickers/remix`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to remix pack' }))
    throw new Error(data.detail || 'Failed to remix sticker pack')
  }
  return resp.json()
}

export async function deleteStickerFromPackAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  stickerId: number,
): Promise<{ success: boolean; message: string }> {
  const resp = await fetch(`${API_BASE}/api/user-stickers/delete-sticker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_string: sessionString, api_id: apiId, api_hash: apiHash, sticker_id: stickerId }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to delete sticker' }))
    throw new Error(data.detail || 'Failed to delete sticker')
  }
  return resp.json()
}

export async function updateStickerEmojiAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  stickerId: number,
  emoji: string,
): Promise<{ success: boolean; message: string }> {
  const resp = await fetch(`${API_BASE}/api/user-stickers/update-emoji`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_string: sessionString, api_id: apiId, api_hash: apiHash, sticker_id: stickerId, emoji }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to update emoji' }))
    throw new Error(data.detail || 'Failed to update emoji')
  }
  return resp.json()
}

export async function reorderStickerAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  stickerId: number,
  position: number,
): Promise<{ success: boolean; message: string }> {
  const resp = await fetch(`${API_BASE}/api/user-stickers/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_string: sessionString, api_id: apiId, api_hash: apiHash, sticker_id: stickerId, position }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to reorder sticker' }))
    throw new Error(data.detail || 'Failed to reorder sticker')
  }
  return resp.json()
}

export async function deleteStickerPackAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  packName: string,
): Promise<DeletePackResult> {
  const resp = await fetch(`${API_BASE}/api/user-stickers/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_string: sessionString, api_id: apiId, api_hash: apiHash, pack_name: packName }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to delete pack' }))
    throw new Error(data.detail || 'Failed to delete sticker pack')
  }
  return resp.json()
}

export async function remixStickerPackAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  sourcePackName: string,
  newTitle: string,
  selectedStickers: { index: number; emoji: string }[],
  files: File[],
  emojiLists: string[][],
): Promise<CreatePackResult> {
  const formData = new FormData()
  formData.append('session_string', sessionString)
  formData.append('api_id', String(apiId))
  formData.append('api_hash', apiHash)
  formData.append('source_pack_name', normalizePackName(sourcePackName))
  formData.append('new_title', newTitle)
  formData.append('selected_stickers', JSON.stringify(selectedStickers))
  formData.append('emoji_lists', JSON.stringify(emojiLists))
  files.forEach((file) => formData.append('files', file))

  const resp = await fetch(`${API_BASE}/api/user-stickers/remix`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to remix pack' }))
    throw new Error(data.detail || 'Failed to remix sticker pack')
  }
  return resp.json()
}

export interface TelegramPackInfo {
  name: string
  title: string
  sticker_count: number
  sticker_type: string
}

export async function getAllStickerPacksAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
): Promise<TelegramPackInfo[]> {
  const resp = await fetch(`${API_BASE}/api/user-stickers/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_string: sessionString, api_id: apiId, api_hash: apiHash }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to fetch packs' }))
    throw new Error(data.detail || 'Failed to fetch sticker packs')
  }
  const json = await resp.json()
  return json.packs
}

export interface SendCodeResult {
  phone_code_hash: string
  session_string: string
}

export interface UserSessionInfo {
  session_string: string
  user_id: number
  first_name: string
  username: string
  phone: string
}

export async function sendCode(
  phone: string,
  apiId: number,
  apiHash: string,
): Promise<SendCodeResult> {
  const resp = await fetch(`${API_BASE}/api/user/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, api_id: apiId, api_hash: apiHash }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to send code' }))
    throw new Error(data.detail || 'Failed to send code')
  }
  return resp.json()
}

export async function signIn(
  phone: string,
  code: string,
  phoneCodeHash: string,
  sessionString: string,
  apiId: number,
  apiHash: string,
  password?: string,
): Promise<UserSessionInfo> {
  const resp = await fetch(`${API_BASE}/api/user/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      code,
      phone_code_hash: phoneCodeHash,
      session_string: sessionString,
      api_id: apiId,
      api_hash: apiHash,
      password: password || null,
    }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to sign in' }))
    throw new Error(data.detail || 'Failed to sign in')
  }
  return resp.json()
}

export async function createStickerPackAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  title: string,
  files: File[],
  emojiLists: string[][],
): Promise<CreatePackResult> {
  const formData = new FormData()
  formData.append('session_string', sessionString)
  formData.append('api_id', String(apiId))
  formData.append('api_hash', apiHash)
  formData.append('title', title)
  formData.append('emoji_lists', JSON.stringify(emojiLists))
  files.forEach((file) => formData.append('files', file))

  const resp = await fetch(`${API_BASE}/api/user-stickers/create`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to create pack' }))
    throw new Error(data.detail || 'Failed to create sticker pack')
  }
  return resp.json()
}

export async function shareStickerPackAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  chatId: number,
  packName: string,
): Promise<ShareStickerResult> {
  const formData = new FormData()
  formData.append('session_string', sessionString)
  formData.append('api_id', String(apiId))
  formData.append('api_hash', apiHash)
  formData.append('chat_id', String(chatId))
  formData.append('pack_name', packName)

  const resp = await fetch(`${API_BASE}/api/user-stickers/share`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to share stickers' }))
    throw new Error(data.detail || 'Failed to share stickers')
  }
  return resp.json()
}

export async function addStickersToPackAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  packName: string,
  files: File[],
  emojiLists: string[][],
): Promise<AddStickersResult> {
  const formData = new FormData()
  formData.append('session_string', sessionString)
  formData.append('api_id', String(apiId))
  formData.append('api_hash', apiHash)
  formData.append('pack_name', packName)
  formData.append('emoji_lists', JSON.stringify(emojiLists))
  files.forEach((file) => formData.append('files', file))

  const resp = await fetch(`${API_BASE}/api/user-stickers/add`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to add stickers' }))
    throw new Error(data.detail || 'Failed to add stickers')
  }
  return resp.json()
}

export async function getStickerSetDetailAsUser(
  sessionString: string,
  apiId: number,
  apiHash: string,
  packName: string,
): Promise<StickerSetDetail> {
  const resp = await fetch(`${API_BASE}/api/user-stickers/detail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_string: sessionString,
      api_id: apiId,
      api_hash: apiHash,
      pack_name: packName,
    }),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ detail: 'Failed to load stickers' }))
    throw new Error(data.detail || 'Failed to load sticker details')
  }
  return resp.json()
}
