import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone, Headphones, Check, MessageCircle } from '../components/ui/Icons'

const contactInfo = [
  { icon: MapPin, title: 'Address', detail: '6 Noor Chamber, Bangali gali Ganpat road Urdu bazar Lahore' },
  { icon: Phone, title: 'Phone', detail: '+92 321 4469509' },
  { icon: Mail, title: 'Email', detail: 'rafieh123456@gmail.com' },
  { icon: Headphones, title: 'Support Hours', detail: 'Mon — Sat, 10:00 AM — 8:00 PM' },
]

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={28} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Message Sent!</h1>
        <p className="text-gray-500 mb-8">We&apos;ll get back to you within 24 hours.</p>
        <button onClick={() => setSubmitted(false)} className="text-primary-400 font-medium hover:text-primary-300">
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-200 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-100 font-medium">Contact Us</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Get in Touch</h1>
      <p className="text-gray-500 mb-10">Have a question? We&apos;d love to hear from you.</p>

      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
          <div className="bg-night-900 rounded-xl border border-night-700 p-6 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input type="text" required
                  className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" required
                  className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
              <input type="text" required
                className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
              <textarea rows={5} required
                className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
            </div>
            <button type="submit"
              className="mt-4 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97]">
              Send Message
            </button>
          </div>
        </form>

        {/* Info cards */}
        <div className="lg:col-span-2 space-y-4">
          {contactInfo.map((info) => (
            <div key={info.title} className="bg-night-900 rounded-xl border border-night-700 p-5 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center shrink-0">
                <info.icon size={20} className="text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{info.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{info.detail}</p>
              </div>
            </div>
          ))}

          {/* WhatsApp button */}
          <a
            href="https://wa.me/923214469509"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full px-5 py-3.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors active:scale-[0.97] shadow-sm"
          >
            <MessageCircle size={22} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
