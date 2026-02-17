import './Navbar.css'
import { useState } from 'react'
import byteBoardLogo from '../assets/byteboard_logo.png'

const viewItems = ['Feed', 'Saved', 'MyPosts', 'Settings']

const Navbar = ({ currentUser, onSignOut, activeView = 'Feed', onNavigate }) => {
  const avatar = currentUser?.photoURL || ``;
  const name = currentUser?.displayName || currentUser?.email || 'Profile'
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__logo">
          <span className="navbar__logoMark">
            <img src={byteBoardLogo} alt="ByteBoard logo" />
          </span>
          <span className="navbar__logoText">ByteBoard</span>
        </div>

        <div className="navbar__search">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="navbar__searchIcon">
            <path d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search posts, tags, people" />
        </div>

        <div className="navbar__actions">
          <button className="btn btn--ghost" onClick={onSignOut}>Sign out</button>

          <button className="icon-button" aria-label="Saved" onClick={() => onNavigate?.('Saved')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
            </svg>
          </button>

          <div className="navbar__profile-stack">
            <button
              className="navbar__avatar"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {avatar ? (
                <img src={avatar} alt=''/>
              ) : (
                <span className="navbar__avatarFallback" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.4 0-8 2.4-8 5.3 0 .4.3.7.7.7h14.6c.4 0 .7-.3.7-.7 0-2.9-3.6-5.3-8-5.3z" />
                  </svg>
                </span>
              )}
              <span className="navbar__name">{name}</span>
              <span className="navbar__caret" />
            </button>

            {menuOpen && (
              <div className="navbar__menu">
                {viewItems.map((item) => (
                  <button
                    key={item}
                    className={`navbar__menuItem${activeView === item ? ' is-active' : ''}`}
                    onClick={() => {
                      onNavigate?.(item)
                      setMenuOpen(false)
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar;
