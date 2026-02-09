import { Outlet, NavLink, useLocation } from 'react-router-dom'
import './Layout.css'

const navItems = [
  { path: '/', icon: '📖', label: 'Journal' },
  { path: '/new', icon: '✨', label: 'New', isMain: true },
]

export default function Layout() {
  const location = useLocation()
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
        </nav>
      )}
    </div>
  )
}
