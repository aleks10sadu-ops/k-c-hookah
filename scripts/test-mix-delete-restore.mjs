import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const RUN_ID = `__codex_test_${Date.now()}_${Math.random().toString(16).slice(2)}`

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env.local')
  const content = readFileSync(envPath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator)
    const value = trimmed.slice(separator + 1).replace(/^["']|["']$/g, '')
    process.env[key] ||= value
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  const body = text ? JSON.parse(text) : {}

  if (!response.ok || body.error) {
    throw new Error(body.error || `HTTP ${response.status} for ${path}`)
  }

  return body
}

async function getTobaccoById(supabase, id) {
  const { data, error } = await supabase
    .from('tobacco_items')
    .select('id, name, available_grams')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

async function deleteTobaccoById(supabase, id) {
  const { error } = await supabase
    .from('tobacco_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

async function deleteMixIfExists(supabase, id) {
  const { error } = await supabase
    .from('mixes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

async function main() {
  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  assert(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL is required')
  assert(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const createdTobaccoIds = []
  let createdMixId = null

  try {
    const stats = await api('/api/statistics/mixes-detailed?period=all')
    const creatorId = stats.data?.find((mix) => mix.creator_id)?.creator_id
    assert(creatorId, 'No existing creator_id found for FK-safe test mix creation')

    const tobaccoA = await api('/api/tobacco', {
      method: 'POST',
      body: JSON.stringify({
        name: `${RUN_ID}_a`,
        available_grams: 100,
        image_url: null,
      }),
    })
    const tobaccoB = await api('/api/tobacco', {
      method: 'POST',
      body: JSON.stringify({
        name: `${RUN_ID}_b`,
        available_grams: 80,
        image_url: null,
      }),
    })

    createdTobaccoIds.push(tobaccoA.data.id, tobaccoB.data.id)

    const createdMix = await api('/api/mixes', {
      method: 'POST',
      body: JSON.stringify({
        name: `${RUN_ID}_mix`,
        creator_id: creatorId,
        total_grams: 35,
        issavedtemplate: false,
        items: [
          {
            tobaccoid: tobaccoA.data.id,
            grams: 20,
            percentage: 57.14,
          },
          {
            tobaccoid: tobaccoB.data.id,
            grams: 15,
            percentage: 42.86,
          },
        ],
      }),
    })

    createdMixId = createdMix.data.id

    const afterCreateA = await getTobaccoById(supabase, tobaccoA.data.id)
    const afterCreateB = await getTobaccoById(supabase, tobaccoB.data.id)
    assert(afterCreateA.available_grams === 80, `Expected tobacco A to be 80g after create, got ${afterCreateA.available_grams}`)
    assert(afterCreateB.available_grams === 65, `Expected tobacco B to be 65g after create, got ${afterCreateB.available_grams}`)

    await api(`/api/mixes?id=${createdMixId}`, {
      method: 'DELETE',
    })
    createdMixId = null

    const afterDeleteA = await getTobaccoById(supabase, tobaccoA.data.id)
    const afterDeleteB = await getTobaccoById(supabase, tobaccoB.data.id)
    assert(afterDeleteA.available_grams === 100, `Expected tobacco A to be restored to 100g, got ${afterDeleteA.available_grams}`)
    assert(afterDeleteB.available_grams === 80, `Expected tobacco B to be restored to 80g, got ${afterDeleteB.available_grams}`)

    const { data: remainingMixes, error: remainingMixesError } = await supabase
      .from('mixes')
      .select('id')
      .eq('name', `${RUN_ID}_mix`)

    if (remainingMixesError) throw remainingMixesError
    assert(remainingMixes.length === 0, `Expected temporary mix to be deleted, found ${remainingMixes.length}`)

    const source = readFileSync(resolve(process.cwd(), 'components/mix/MixCreator.tsx'), 'utf8')
    assert(source.includes('const isCreatingRef = useRef(false)'), 'MixCreator must keep a synchronous create guard')
    assert(source.includes('if (isCreatingRef.current)'), 'MixCreator must return early while a create request is in flight')

    console.log('PASS: temporary mix creation deducted inventory')
    console.log('PASS: deleting the mix restored inventory')
    console.log('PASS: temporary mix was removed from history')
    console.log('PASS: MixCreator has a synchronous double-submit guard')
  } finally {
    const cleanupErrors = []

    if (createdMixId) {
      try {
        await deleteMixIfExists(supabase, createdMixId)
      } catch (error) {
        cleanupErrors.push(`mix ${createdMixId}: ${error.message}`)
      }
    }

    for (const tobaccoId of createdTobaccoIds) {
      try {
        await deleteTobaccoById(supabase, tobaccoId)
      } catch (error) {
        cleanupErrors.push(`tobacco ${tobaccoId}: ${error.message}`)
      }
    }

    const { data: leftovers, error: leftoversError } = await supabase
      .from('tobacco_items')
      .select('id, name')
      .like('name', `${RUN_ID}%`)

    if (leftoversError) {
      cleanupErrors.push(`leftover check: ${leftoversError.message}`)
    } else if (leftovers.length > 0) {
      cleanupErrors.push(`leftover tobacco rows: ${leftovers.map((item) => item.id).join(', ')}`)
    }

    if (cleanupErrors.length > 0) {
      throw new Error(`Cleanup failed: ${cleanupErrors.join('; ')}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
