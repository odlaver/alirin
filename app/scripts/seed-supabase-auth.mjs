import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(here, '..')

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {}

  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        if (index === -1) return [line, '']
        return [line.slice(0, index), line.slice(index + 1)]
      })
  )
}

const localEnv = {
  ...readEnvFile(resolve(appRoot, '.env')),
  ...readEnvFile(resolve(appRoot, '.env.local')),
  ...process.env,
}

function requireEnv(name, aliases = []) {
  const value = [name, ...aliases]
    .map((key) => localEnv[key])
    .find((item) => String(item || '').trim())

  if (!value) {
    throw new Error(`Env ${name} wajib diisi sebelum menjalankan seed auth.`)
  }

  return String(value).trim()
}

const supabaseUrl = requireEnv('VITE_SUPABASE_URL', ['SUPABASE_URL'])
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const defaultDemoPassword = 'alirin123'

const users = [
  {
    label: 'admin',
    email: localEnv.ALIRIN_ADMIN_EMAIL || 'admin@alirin.local',
    password: localEnv.ALIRIN_ADMIN_PASSWORD || defaultDemoPassword,
    metadata: {
      name: localEnv.ALIRIN_ADMIN_NAME || 'Admin ALIRIN',
      role: 'admin',
    },
  },
  {
    label: 'petugas',
    email: localEnv.ALIRIN_PETUGAS_EMAIL || 'petugas@alirin.local',
    password: localEnv.ALIRIN_PETUGAS_PASSWORD || defaultDemoPassword,
    metadata: {
      name: localEnv.ALIRIN_PETUGAS_NAME || 'Budi Santoso',
      officerId: localEnv.ALIRIN_PETUGAS_OFFICER_ID || 'ofc-budi',
      role: 'petugas',
    },
  },
]

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function findUserByEmail(email) {
  let page = 1

  while (page < 100) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase())
    if (user) return user
    if (data.users.length < 1000) return null
    page += 1
  }

  throw new Error('Jumlah user Auth terlalu banyak untuk discan dengan script ini.')
}

async function upsertAuthUser(userConfig) {
  const existing = await findUserByEmail(userConfig.email)
  const appMetadata = {
    ...(existing?.app_metadata || {}),
    role: userConfig.metadata.role,
  }
  const userMetadata = {
    ...(existing?.user_metadata || {}),
    ...userConfig.metadata,
  }

  if (!existing) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userConfig.email,
      password: userConfig.password,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    })
    if (error) throw error
    return { action: 'created', user: data.user }
  }

  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
    password: userConfig.password,
    email_confirm: true,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  })
  if (error) throw error
  return { action: 'updated', user: data.user }
}

for (const userConfig of users) {
  const { action, user } = await upsertAuthUser(userConfig)
  console.log(`${userConfig.label}: ${action} ${user.email}`)
}

console.log('Selesai. Login memakai password dari env lokal, bukan dari repo.')
