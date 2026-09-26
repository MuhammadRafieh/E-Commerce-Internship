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
      max_tokens: 300,
      messages: [{ role: 'system', content: system }, ...history],
    }),
  })

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`)
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
      generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
    }),
  })

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('')?.trim() || null
}

/**
 * Returns a natural-language reply, or null if the LLM is unconfigured or
 * fails. Callers must treat null as "use the fallback".
 */
export const complete = async ({ system, history }) => {
  const cfg = getConfig()
  if (!cfg) return null

  try {
    const text =
      cfg.provider === 'gemini'
        ? await callGemini(cfg, system, history)
        : await callOpenAI(cfg, system, history)
    return text || null
  } catch (err) {
    console.error('[llm] request failed, falling back:', err.message)
    return null
  }
}
