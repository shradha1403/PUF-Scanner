import { useState } from 'react'
import Login from './pages/Login'
import FirstView from './pages/FirstView'
import SecondView from './pages/SecondView'

// App has 3 screens:
// 1. Login — enter group/server number
// 2. Main — tab bar with FirstView and SecondView
// 3. Exit goes back to Login

export default function App() {
  const [screen, setScreen] = useState('login') // 'login' | 'main'
  const [groupNumber, setGroupNumber] = useState('11')
  const [serverNumber, setServerNumber] = useState('0')
  const [activeTab, setActiveTab] = useState(0) // 0 = FirstView, 1 = SecondView

  const handleStart = (group, server) => {
    setGroupNumber(group)
    setServerNumber(server)
    setScreen('main')
  }

  const handleExit = () => {
    setScreen('login')
    setActiveTab(0)
  }

  if (screen === 'login') {
    return <Login onStart={handleStart} />
  }

  return (
    <div style={styles.container}>
      {/* Tab content */}
      <div style={styles.content}>
        {activeTab === 0 ? (
          <FirstView
            groupNumber={groupNumber}
            serverNumber={serverNumber}
            onExit={handleExit}
          />
        ) : (
          <SecondView
            groupNumber={groupNumber}
            serverNumber={serverNumber}
            onExit={handleExit}
          />
        )}
      </div>

      {/* Bottom tab bar — matches MainTabController in Swift */}
      <div style={styles.tabBar}>
        <button
          style={styles.tab(activeTab === 0)}
          onClick={() => setActiveTab(0)}
        >
          <span style={styles.tabIcon}>📷</span>
          <span style={styles.tabLabel}>Scan</span>
        </button>
        <button
          style={styles.tab(activeTab === 1)}
          onClick={() => setActiveTab(1)}
        >
          <span style={styles.tabIcon}>🔬</span>
          <span style={styles.tabLabel}>Advanced</span>
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0a0a',
    fontFamily: '-apple-system, system-ui, sans-serif',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
  },
  tabBar: {
    display: 'flex',
    borderTop: '1px solid #222',
    backgroundColor: '#111',
    paddingBottom: 'env(safe-area-inset-bottom)', // iPhone safe area
  },
  tab: (active) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: active ? '#0a84ff' : '#666',
    gap: 4,
  }),
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
}