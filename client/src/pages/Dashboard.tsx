import { useState, useEffect } from 'react'
import { CheckSquare, Bookmark as BookmarkIcon, Tag as TagIcon, LogOut, Menu, X } from 'lucide-react'
import { api } from '../api'
import TasksView from '../views/TasksView'
import BookmarksView from '../views/BookmarksView'
import TagsView from '../views/TagsView'

type View = 'tasks' | 'bookmarks' | 'tags'

export default function Dashboard() {
  const [view, setView] = useState<View>('tasks')
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => logout())
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('auth-change'))
  }

  const navItems: { key: View; label: string; Icon: typeof CheckSquare }[] = [
    { key: 'tasks', label: 'Tasks', Icon: CheckSquare },
    { key: 'bookmarks', label: 'Bookmarks', Icon: BookmarkIcon },
    { key: 'tags', label: 'Tags', Icon: TagIcon },
  ]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f0f13', color: '#e2e8f0' }}>
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className="fixed lg:static z-30 flex flex-col h-full w-56 shrink-0 transition-transform duration-300"
        style={{
          background: 'rgba(20,15,35,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
      >
        <div className="p-5">
          <h1 className="text-xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(240,100,30,0.5)' }}>
            DevBoard
          </h1>
          {user && (
            <p className="text-xs text-slate-500 mt-1 truncate">{user.email}</p>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { setView(key); setSidebarOpen(false) }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: view === key ? 'rgba(240,100,30,0.18)' : 'transparent',
                color: view === key ? '#f09050' : '#94a3b8',
                borderLeft: view === key ? '2px solid #f06420' : '2px solid transparent',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 transition-colors duration-150"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,15,35,0.9)' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-white">DevBoard</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 lg:hidden">
            <X size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {view === 'tasks' && <TasksView />}
          {view === 'bookmarks' && <BookmarksView />}
          {view === 'tags' && <TagsView />}
        </main>
      </div>
    </div>
  )
}
