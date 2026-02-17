import './SidebarLeft.css'

const menuItems = [
  { label: 'Feed' },
  { label: 'Saved' },
  { label: 'MyPosts' },
  { label: 'Settings' },
]

const SidebarLeft = ({ activeItem = 'Feed', onSelect, currentUser, userData }) => {
  const displayName = currentUser?.displayName || currentUser?.email || 'User'
  const profileHandle = userData?.handle || ''
  const fallbackHandle = '@user'

  return (
    <aside className="sidebar-left">
      <nav className="sidebar-left__menu">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`sidebar-left__item${item.label === activeItem ? ' is-active' : ''}`}
            onClick={() => onSelect?.(item.label)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-left__user">
        <img src={currentUser?.photoURL || ''} alt="User" />
        <div>
          <p className="sidebar-left__name">{displayName}</p>
          <p className="sidebar-left__meta">{profileHandle || fallbackHandle}</p>
        </div>
      </div>
    </aside>
  )
}

export default SidebarLeft
