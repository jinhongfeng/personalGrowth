import CryptoJS from 'crypto-js'

const SALT_KEY = 'pg_app_salt'
const KEY_SIZE = 256 / 32
const ITERATIONS = 1000

export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128 / 8).toString()
}

export function deriveKey(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS
  }).toString()
}

export function encrypt(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString()
}

export function decrypt(ciphertext: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString()
}

export function verifyPassword(password: string, hash: string): boolean {
  return CryptoJS.SHA256(password).toString() === hash
}

// 使用 crypto.getRandomValues 生成安全随机密码
export function generateSecurePassword(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length]
  }
  return password
}

// 主密码管理
const MASTER_PWD_HASH_KEY = 'pg_app_master_pwd_hash'
const MASTER_PWD_SALT_KEY = 'pg_app_master_pwd_salt'

export function setMasterPassword(password: string): void {
  const salt = generateSalt()
  const hash = hashPassword(password + salt)
  localStorage.setItem(MASTER_PWD_HASH_KEY, hash)
  localStorage.setItem(MASTER_PWD_SALT_KEY, salt)
}

export function verifyMasterPassword(password: string): boolean {
  const hash = localStorage.getItem(MASTER_PWD_HASH_KEY)
  const salt = localStorage.getItem(MASTER_PWD_SALT_KEY)
  if (!hash || !salt) return false
  return hashPassword(password + salt) === hash
}

export function hasMasterPassword(): boolean {
  return !!localStorage.getItem(MASTER_PWD_HASH_KEY)
}

export function changeMasterPassword(oldPassword: string, newPassword: string): boolean {
  if (!verifyMasterPassword(oldPassword)) return false
  setMasterPassword(newPassword)
  return true
}
