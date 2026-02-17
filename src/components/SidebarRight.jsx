import './SidebarRight.css'

const SidebarRight = () => {
  return (
    <aside className="sidebar-right">
      <section className="sidebar-right__card">
        <h3>Announcements</h3>
        <ul className="sidebar-right__announcements">
          <li>New code snippets feature is live.</li>
          <li>Weekly design jam starts Friday.</li>
          <li>Dark mode beta is open for signups.</li>
        </ul>
      </section>
    </aside>
  )
}

export default SidebarRight
