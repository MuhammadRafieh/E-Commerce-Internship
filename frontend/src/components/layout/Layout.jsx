import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import AIAssistant from '../common/AIAssistant'

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
      <span className="w-8 h-8 border-2 border-night-700 border-t-primary-500 rounded-full animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex flex-col min-h-screen bg-night-950">
      <Navbar />
      <main className="flex-1">
        {/* Boundary sits inside the shell so Navbar/Footer stay mounted
            while a lazily-loaded page chunk is fetched. */}
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  )
}
