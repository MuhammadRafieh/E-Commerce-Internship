import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, ChevronRight } from '../ui/Icons'
import { formatCurrency } from '../../utils/formatCurrency'
import api from '../../services/api'

const QUICK_ACTIONS = [
  { label: 'Under Rs 500', msg: 'Show me products under Rs 500' },
  { label: 'Best rated', msg: 'Show me the best rated products' },
  { label: 'Cheapest', msg: 'What are the cheapest products?' },
  { label: 'Electronics', msg: 'Show me electronics' },
]

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your shopping assistant. Ask me about products, prices, or categories.", products: [] },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  const handleSend = async (overrideMsg) => {
    const text = (overrideMsg || input).trim()
    if (!text || sending) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text, products: [] }])
    setSending(true)

    try {
      const res = await api.post('/ai/chat', { message: text })
      const { reply, products } = res.data
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply, products: products || [] },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "Sorry, I couldn't process that. Please try again.", products: [] },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-32px)] bg-night-900 rounded-2xl shadow-2xl border border-night-700 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-primary-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Shopping Assistant</p>
                <p className="text-xs text-white/70">AI-powered help</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-night-800 text-gray-100 rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
                {msg.products.length > 0 && (
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
                          <p className="text-xs text-primary-400 font-semibold">{formatCurrency(p.price)}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-night-800 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-400">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => handleSend(a.msg)}
                  className="text-xs px-3 py-1.5 bg-night-800 text-gray-400 rounded-full border border-night-700 hover:bg-primary-500/15 hover:text-primary-300 hover:border-primary-500/30 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-night-700 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
