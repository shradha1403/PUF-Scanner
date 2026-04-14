import { useState, useEffect } from 'react'

const PASSWORD = 'wolfpack'

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, system-ui, sans-serif',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: '32px 24px',
    border: '1px solid #2a2a2a',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 12,
    border: '1px solid #222',
  },
  label: {
    color: '#aaa',
    fontSize: 13,
  },
  value: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resetBtn: {
    backgroundColor: '#2a2a2a',
    color: '#888',
    border: 'none',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  startBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#0a84ff',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: 8,
  },
  // Modal styles
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 24,
  },
  modal: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: '24px 20px',
    width: '100%',
    maxWidth: 340,
    border: '1px solid #2a2a2a',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
    boxSizing: 'border-box',
    outline: 'none',
  },
  errorText: {
    color: '#ff453a',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBtns: {
    display: 'flex',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#2a2a2a',
    color: '#aaa',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#0a84ff',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
  },
}

function ResetModal({ title, onConfirm, onCancel }) {
  const [password, setPassword] = useState('')
  const [newValue, setNewValue] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (password !== PASSWORD) {
      setError('Incorrect password')
      return
    }
    if (!newValue.trim()) {
      setError('Please enter a value')
      return
    }
    onConfirm(newValue.trim())
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>{title}</div>
        <input
          style={styles.input}
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
        />
        <input
          style={styles.input}
          type="text"
          placeholder="Enter new value"
          value={newValue}
          onChange={e => { setNewValue(e.target.value); setError('') }}
        />
        {error && <div style={styles.errorText}>{error}</div>}
        <div style={styles.modalBtns}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.confirmBtn} onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default function Login({ onStart }) {
  const [groupNumber, setGroupNumber] = useState('11')
  const [serverNumber, setServerNumber] = useState('0')
  const [modal, setModal] = useState(null) // 'group' | 'server' | null

  // Load from localStorage on mount (equivalent to UserDefaults in Swift)
  useEffect(() => {
    const savedGroup = localStorage.getItem('group') || '11'
    const savedServer = localStorage.getItem('server') || '0'
    setGroupNumber(savedGroup)
    setServerNumber(savedServer)
  }, [])

  const handleGroupConfirm = (value) => {
    setGroupNumber(value)
    localStorage.setItem('group', value)
    setModal(null)
  }

  const handleServerConfirm = (value) => {
    setServerNumber(value)
    localStorage.setItem('server', value)
    setModal(null)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>PUF Scanner</div>
        <div style={styles.subtitle}>Configure your session before starting</div>

        {/* Group Number Row */}
        <div style={styles.row}>
          <div>
            <div style={styles.label}>Group No.</div>
            <div style={styles.value}>{groupNumber}</div>
          </div>
          <button style={styles.resetBtn} onClick={() => setModal('group')}>Reset</button>
        </div>

        {/* Server Number Row */}
        <div style={styles.row}>
          <div>
            <div style={styles.label}>Server No.</div>
            <div style={styles.value}>{serverNumber}</div>
          </div>
          <button style={styles.resetBtn} onClick={() => setModal('server')}>Reset</button>
        </div>

        {/* Start Button */}
        <button style={styles.startBtn} onClick={() => onStart && onStart(groupNumber, serverNumber)}>
          Start
        </button>
      </div>

      {/* Modals */}
      {modal === 'group' && (
        <ResetModal
          title="Reset Group No."
          onConfirm={handleGroupConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'server' && (
        <ResetModal
          title="Set Server No."
          onConfirm={handleServerConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}