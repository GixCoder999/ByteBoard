import Navbar from '../components/Navbar'
import SidebarLeft from '../components/SidebarLeft'
import SidebarRight from '../components/SidebarRight'
import Feed from '../components/Feed'
import SavedPosts from '../components/SavedPosts'
import MyPosts from '../components/MyPosts'
import Settings from '../components/Settings'
import './Home.css'
import { useState } from 'react'

const Home = ({
  savedPosts,
  setSavedPosts,
  currentUser,
  userData,
  notificationPermission,
  onProfileUpdated,
  onSignOut
}) => {
  const [activeView, setActiveView] = useState('Feed')

  return (
    <div className="home">
      <Navbar
        currentUser={currentUser}
        notificationPermission={notificationPermission}
        onSignOut={onSignOut}
        activeView={activeView}
        onNavigate={setActiveView}
      />
      <main className="home__layout">
        <SidebarLeft
          activeItem={activeView}
          onSelect={setActiveView}
          currentUser={currentUser}
          userData={userData}
        />
        {activeView === 'Feed'
          && <Feed savedPosts={savedPosts} setSavedPosts={setSavedPosts} currentUser={currentUser} />
        }
        {activeView === 'Saved'
          && <SavedPosts savedPosts={savedPosts} setSavedPosts={setSavedPosts} currentUser={currentUser} />
        }
        {activeView==='MyPosts' && (
          <MyPosts savedPosts={savedPosts} setSavedPosts={setSavedPosts} currentUser={currentUser} />
        )}
        {activeView==='Settings' && (
          <Settings currentUser={currentUser} userData={userData} onProfileUpdated={onProfileUpdated} />
        )}
        <SidebarRight />
      </main>
    </div>
  )
}

export default Home
