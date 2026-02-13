import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
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
  const isDetail = location.pathname.startsWith('/entry/')

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
            <button className="profile-menu-signout" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
