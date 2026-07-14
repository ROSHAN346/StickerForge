'use client'

export interface SavedPack {
  name: string
  title: string
  link: string
  botUsername: string
  stickerCount: number
  createdAt: number
  userId?: number
}

const STORAGE_KEY = 'tg_sticker_packs'

export function getPacks(): SavedPack[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getPacksByUserId(userId: number): SavedPack[] {
  return getPacks().filter((p) => p.userId === userId || p.userId === undefined)
}

export function getUniqueBots(userId: number): string[] {
  const packs = getPacksByUserId(userId)
  const all = packs.length > 0 ? packs : getPacks()
  return [...new Set(all.map((p) => p.botUsername))]
}

export function savePack(pack: SavedPack) {
  if (typeof window === 'undefined') return
  const packs = getPacks()
  const existing = packs.findIndex((p) => p.name === pack.name)
  if (existing >= 0) {
    packs[existing] = pack
  } else {
    packs.unshift(pack)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs))
}

export function updatePackCount(name: string, addedCount: number) {
  if (typeof window === 'undefined') return
  const packs = getPacks()
  const idx = packs.findIndex((p) => p.name === name)
  if (idx >= 0) {
    packs[idx].stickerCount += addedCount
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packs))
  }
}

export function deletePack(name: string) {
  if (typeof window === 'undefined') return
  const packs = getPacks().filter((p) => p.name !== name)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs))
}

const TOKEN_KEY = 'tg_bot_token'
const BOT_INFO_KEY = 'tg_bot_info'
const USER_ID_KEY = 'tg_user_id'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(BOT_INFO_KEY)
  sessionStorage.removeItem(USER_ID_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(API_ID_KEY)
  sessionStorage.removeItem(API_HASH_KEY)
  sessionStorage.removeItem(LOGIN_METHOD_KEY)
  sessionStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(STORAGE_KEY)
}

export function clearAll() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(BOT_INFO_KEY)
  sessionStorage.removeItem(USER_ID_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(API_ID_KEY)
  sessionStorage.removeItem(API_HASH_KEY)
  sessionStorage.removeItem(LOGIN_METHOD_KEY)
  sessionStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(STORAGE_KEY)
}

export function getBotInfo(): BotInfoStorage | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(BOT_INFO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setBotInfo(info: BotInfoStorage) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(BOT_INFO_KEY, JSON.stringify(info))
}

export interface BotInfoStorage {
  id: number
  username: string
  first_name: string
  can_join_groups: boolean
}

export function getUserId(): number | null {
  if (typeof window === 'undefined') return null
  const stored = sessionStorage.getItem(USER_ID_KEY)
  if (stored) return Number(stored)
  return null
}

export function setUserId(id: number) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(USER_ID_KEY, String(id))
}

const SESSION_KEY = 'tg_user_session'
const API_ID_KEY = 'tg_api_id'
const API_HASH_KEY = 'tg_api_hash'
const LOGIN_METHOD_KEY = 'tg_login_method'
const USER_INFO_KEY = 'tg_user_info'

export interface UserInfoStorage {
  user_id: number
  first_name: string
  username: string
  phone: string
}

export function getUserInfo(): UserInfoStorage | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(USER_INFO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUserInfo(info: UserInfoStorage) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
}

export type LoginMethod = 'bot' | 'user'

export function getLoginMethod(): LoginMethod | null {
  if (typeof window === 'undefined') return null
  return (sessionStorage.getItem(LOGIN_METHOD_KEY) as LoginMethod) || null
}

export function setLoginMethod(method: LoginMethod) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LOGIN_METHOD_KEY, method)
}

export function getUserSession(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SESSION_KEY)
}

export function setUserSession(session: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, session)
}

export function getApiCreds(): { apiId: number; apiHash: string } | null {
  if (typeof window === 'undefined') return null
  const id = sessionStorage.getItem(API_ID_KEY)
  const hash = sessionStorage.getItem(API_HASH_KEY)
  if (!id || !hash) return null
  return { apiId: Number(id), apiHash: hash }
}

export function setApiCreds(apiId: number, apiHash: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(API_ID_KEY, String(apiId))
  sessionStorage.setItem(API_HASH_KEY, apiHash)
}
