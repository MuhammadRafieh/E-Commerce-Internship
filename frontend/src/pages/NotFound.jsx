import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-bold text-white">404</h1>
      <p className="mt-2 text-lg text-white/85">Page not found</p>
      <Link to="/" className="mt-4 underline transition-colors text-primary-400 font-medium hover:text-primary-300">Go home</Link>
    </section>
  )
}
