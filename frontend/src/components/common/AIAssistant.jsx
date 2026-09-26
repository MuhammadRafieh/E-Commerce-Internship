import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, ChevronRight, Sparkles, Trash2 } from '../ui/Icons'
import { formatCurrency } from '../../utils/formatCurrency'
import api from '../../services/api'

const QUICK_ACTIONS = [
  { label: 'Under Rs 500', msg: 'Show me products under Rs 500' },
  { label: 'Best rated', msg: 'Show me the best rated products' },
  { label: 'Cheapest', msg: 'What are the cheapest products?' },
  { label: 'Electronics', msg: 'Show me electronics' },
  { label: 'Deals', msg: 'Show me current deals and discounts' },
  { label: 'In stock', msg: 'What electronics are in stock?' },
]

const GREETING = {
  role: 'assistant',
  text: "Hi! I'm your shopping assistant. Ask me about products, prices, categories or current deals.",
  products: [],
}

const MAX_LENGTH = 500

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [source, setSource] = useState(null)
  const [llm, setLlm] = useState(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  /* Close on Escape — expected of any dismissible overlay. */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleSend = useCallback(
    async (overrideMsg) => {
      const text = (overrideMsg || input).trim().slice(0, MAX_LENGTH)
      if (!text || sending) return

      setInput('')
      /* Capture prior turns before this one is appended, so the backend
         receives real conversation context. */
      const priorTurns = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.text }))

      setMessages((prev) => [...prev, { role: 'user', text, products: [] }])
      setSending(true)

      try {
        const res = await api.post('/ai/chat', { message: text, history: priorTurns })
        const { reply, products, source: src, llm: info } = res.data
        setSource(src || null)
        setLlm(info || null)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: reply, products: products || [] },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: "Sorry, I couldn't process that. Please try again.",
            products: [],
          },
        ])
      } finally {
        setSending(false)
        inputRef.current?.focus()
      }
    },
    [input, messages, sending],
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([GREETING])
    setSource(null)
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {open && (
        <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[380px] max-h-[70vh] sm:max-h-none bg-night-900 rounded-2xl shadow-2xl border border-night-700 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-primary-600 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  Shopping Assistant
                  {source === 'llm' && <Sparkles size={13} className="text-white/80" />}
                </p>
                <p className="text-xs text-white/70">
                  {source === 'llm' && llm
                    ? `${llm.provider} · ${llm.model}`
                    : 'Product search'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Clear conversation"
                  title="Clear conversation"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[45vh] sm:max-h-[380px]">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-night-800 text-gray-100 rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
                {msg.products?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.products.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 p-2.5 bg-night-800 rounded-xl border border-night-700 hover:border-primary-500/30 hover:shadow-sm transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-night-800 overflow-hidden shrink-0">
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{p.name}</p>
                          <p className="text-xs flex items-center gap-1.5 flex-wrap">
                            <span className="text-primary-400 font-semibold">
                              {formatCurrency(p.price)}
                            </span>
                            {p.isDeal && p.originalPrice > p.price && (
                              <span className="text-gray-500 line-through">
                                {formatCurrency(p.originalPrice)}
                              </span>
                            )}
                            {p.inStock === false && (
                              <span className="text-red-400">Out of stock</span>
                            )}
                          </p>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-gray-300 group-hover:text-primary-500 transition-colors shrink-0"
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-night-800 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  <span className="sr-only">Thinking</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => handleSend(a.msg)}
                  disabled={sending}
                  className="text-xs px-3 py-1.5 bg-night-800 text-gray-400 rounded-full border border-night-700 hover:bg-primary-500/15 hover:text-primary-300 hover:border-primary-500/30 transition-colors disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-night-700 p-3 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={handleKeyDown}
                placeholder="Ask about products..."
                className="flex-1 px-4 py-2.5 text-sm border border-night-700 rounded-xl bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
