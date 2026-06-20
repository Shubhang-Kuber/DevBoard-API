import { useState, useEffect } from 'react';
import { api } from './api';
import { Auth } from './components/Auth';
import { Tasks } from './components/Tasks';
import { Bookmarks } from './components/Bookmarks';
import { Tags } from './components/Tags';
import { ToastStack } from './components/Toast';

const NAV = [
  { id: 'tasks',     label: 'Tasks',     icon: '✓' },
  { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
  { id: 'tags',      label: 'Tags',      icon: '#' },
];

function Sidebar({ user, page, onNav, onLogout }) {
  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Dev<span>Board</span></div>

      <div className="sidebar-section">Workspace</div>

      {NAV.map((n) => (
        <button
          key={n.id}
          className={`nav-item ${page === n.id ? 'active' : ''}`}
          onClick={() => onNav(n.id)}
        >
          <span className="nav-icon">{n.icon}</span>
          {n.label}
        </button>
      ))}

      <div className="sidebar-bottom">
        <div className="user-row">
          <div className="user-avatar">{initials}</div>
          <div className="user-name">{user?.name ?? user?.email ?? 'User'}</div>
        </div>
        <button className="nav-item" onClick={onLogout}>
          <span className="nav-icon">→</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('tasks');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setCheckingAuth(false);
      return;
    }
    api.me()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setCheckingAuth(false));
  }, []);

  function handleAuth(u) { setUser(u); }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 22, height: 22, borderWidth: 2.5 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onAuth={handleAuth} />
        <ToastStack />
      </>
    );
  }

  return (
    <>
      <div className="app-shell">
        <Sidebar user={user} page={page} onNav={setPage} onLogout={handleLogout} />
        <main className="main">
          {page === 'tasks'     && <Tasks />}
          {page === 'bookmarks' && <Bookmarks />}
          {page === 'tags'      && <Tags />}
        </main>
      </div>
      <ToastStack />
    </>
  );
}
