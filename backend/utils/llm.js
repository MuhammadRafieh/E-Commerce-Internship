/**
 * Minimal, provider-agnostic LLM client.
 *
 * Uses the global fetch (Node 18+) rather than an SDK so the project gains
 * LLM support without adding a dependency. Set LLM_PROVIDER + LLM_API_KEY to
 * enable; when they are absent `complete()` returns null and the caller falls
 * back to the deterministic rule-based assistant, so the feature never breaks
 * the app.
 *
 * The key is read only from server-side env and is never sent to the browser.
 */

const TIMEOUT_MS = 15000

/* Gemini 3.x bills thinking tokens against maxOutputTokens, so a small cap
   starves the visible answer and returns a truncated sentence. */
const MAX_OUTPUT_TOKENS = 2048

/* Gemini frequently answers 429/503 ("high demand"). These are transient, so
   retry briefly with backoff before giving up and falling back. */
const MAX_ATTEMPTS = 3
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const getConfig = () => {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase()
  const apiKey = process.env.LLM_API_KEY
  if (!provider || !apiKey) return null
  return {
    provider,
    apiKey,
    model:
      process.env.LLM_MODEL ||
      (provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'),
    /* Overridable so the integration can be pointed at a proxy, a
       self-hosted gateway, or a mock during testing. */
    baseUrl: (process.env.LLM_BASE_URL || '').replace(/\/+$/, ''),
  }
}

export const isLLMEnabled = () => getConfig() !== null

/** Which provider is live, for display in the UI. Null when disabled. */
export const llmInfo = () => {
  const cfg = getConfig()
  return cfg ? { provider: cfg.provider, model: cfg.model } : null
}

const withTimeout = async (url, options) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const callOpenAI = async (cfg, system, history) => {
  const base = cfg.baseUrl || 'https://api.openai.com/v1'
  const res = await withTimeout(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.4,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: 'system', content: system }, ...history],
    }),
  })

  if (!res.ok) {
    const err = new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`)
    err.status = res.status
    throw err
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || null
}

const callGemini = async (cfg, system, history) => {
  const base = cfg.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
  const url = `${base}/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(
    cfg.apiKey,
  )}`

  /* Gemini uses `system_instruction` and roles user/model. */
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await withTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: MAX_OUTPUT_TOKENS },
    }),
  })

  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`)
    err.status = res.status
    throw err
  }
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('')?.trim() || null
}

/**
 * Returns a natural-language reply, or null if the LLM is unconfigured or
 * fails. Callers must treat null as "use the fallback".
 *
 * Transient upstream failures (429/503 high demand, 5xx) are retried with
 * linear backoff before giving up.
 */
export const complete = async ({ system, history }) => {
  const cfg = getConfig()
  if (!cfg) return null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text =
        cfg.provider === 'gemini'
          ? await callGemini(cfg, system, history)
          : await callOpenAI(cfg, system, history)
      return text || null
    } catch (err) {
      const status = Number(err.status || 0)
      const canRetry = RETRYABLE.has(status) && attempt < MAX_ATTEMPTS

      if (canRetry) {
        const wait = 400 * attempt
        console.warn(
          `[llm] ${status} from provider, retry ${attempt}/${MAX_ATTEMPTS} in ${wait}ms`,
        )
        await sleep(wait)
        continue
      }

      console.error('[llm] request failed, falling back:', err.message)
      return null
    }
  }

  return null
}
