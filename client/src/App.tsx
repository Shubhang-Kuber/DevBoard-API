import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    const handler = () => setAuthed(!!localStorage.getItem('token'))
    window.addEventListener('auth-change', handler)
    return () => window.removeEventListener('auth-change', handler)
  }, [])

  return authed ? <Dashboard /> : <Landing />
}
