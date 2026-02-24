import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import { getOrCreateInvite } from '../utils/storage'
import './Layout.css'

const navItems = [
  { path: '/', icon: '📖', label: 'Journal' },
  { path: '/new', icon: '✨', label: 'New', isMain: true },
  { path: '/circle', icon: '👯‍♀️', label: 'Circle' },
]

export default function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [shareLink, setShareLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const isDetail = location.pathname.startsWith('/entry/')

  useEffect(() => {
    if (user?.uid) {
      getOrCreateInvite(user.uid, user.displayName).then((invite) => {
        setShareLink(`https://sghosh777.github.io/momsjournal/#/family/${invite.id}`)
      }).catch(() => {})
    }
  }, [user?.uid])

  async function handleCopyLink() {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = shareLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="layout">
      <main className="layout-main">
        <Outlet />
      </main>

      {!isDetail && (
        <nav className="bottom-nav">
          {navItems.map((item) =>
            item.isMain ? (
              <NavLink key={item.path} to={item.path} className="nav-item nav-main-btn">
                <span className="nav-main-icon">{item.icon}</span>
              </NavLink>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-active' : ''}`
                }
                end
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          )}

          <button className="nav-item nav-profile" onClick={() => setShowMenu(!showMenu)}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="nav-avatar" referrerPolicy="no-referrer" />
            ) : (
              <span className="nav-icon">👤</span>
            )}
            <span className="nav-label">Me</span>
          </button>
        </nav>
      )}

      {showMenu && (
        <div className="profile-menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="profile-menu-user">
              {user?.photoURL && (
                <img src={user.photoURL} alt="" className="profile-menu-avatar" referrerPolicy="no-referrer" />
              )}
              <div>
                <p className="profile-menu-name">{user?.displayName || 'Mama'}</p>
                <p className="profile-menu-email">{user?.email}</p>
              </div>
            </div>
            <button className="profile-menu-share" onClick={handleCopyLink}>
              <span className="profile-menu-share-icon">🔗</span>
              <span>{copied ? 'Link copied!' : 'Share feed with family'}</span>
            </button>
            <button className="profile-menu-signout" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
