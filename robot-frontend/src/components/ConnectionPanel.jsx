import { useState, useEffect } from 'react'
import styles from './ConnectionPanel.module.css'

export default function ConnectionPanel({ arduinoStatus, wsState, onConnect, onDisconnect }) {
  const [ports, setPorts]       = useState([])
  const [selectedPort, setSelectedPort] = useState('')
  const [manualPort, setManualPort]     = useState('')
  const [scanning, setScanning] = useState(false)

  const scan = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/ports')
      const { ports } = await res.json()
      setPorts(ports)
    } catch {
      /* backend unreachable */
    } finally {
      setScanning(false)
    }
  }

  useEffect(() => { scan() }, [])

  const handleToggle = () => {
    if (arduinoStatus.connected) {
      onDisconnect()
    } else {
      const port = manualPort.trim() || selectedPort
      if (port) onConnect(port)
    }
  }

  const wsColors = { connected: 'var(--cyan)', connecting: 'var(--yellow)', disconnected: 'var(--red)' }
  const wsLabel  = { connected: '● LIVE', connecting: '◌ CONNECTING', disconnected: '○ OFFLINE' }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>// SERIAL CONNECTION</span>
        <div className={styles.badges}>
          <span className={styles.badge} style={{ color: wsColors[wsState], borderColor: wsColors[wsState] }}>
            WS {wsLabel[wsState]}
          </span>
          {arduinoStatus.connected && (
            <span className={styles.badge} style={{ color: 'var(--cyan)', borderColor: 'var(--cyan)', animation: 'pulse-glow 2s infinite' }}>
              ● {arduinoStatus.port}
            </span>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <select
          className={styles.select}
          value={selectedPort}
          onChange={e => setSelectedPort(e.target.value)}
          disabled={arduinoStatus.connected}
        >
          <option value="">— select port —</option>
          {ports.map(p => (
            <option key={p.device} value={p.device}>
              {p.device}{p.description ? ` (${p.description})` : ''}
            </option>
          ))}
        </select>

        <input
          className={styles.input}
          type="text"
          placeholder="or type manually…"
          value={manualPort}
          onChange={e => setManualPort(e.target.value)}
          disabled={arduinoStatus.connected}
        />

        <button className={styles.scanBtn} onClick={scan} disabled={arduinoStatus.connected || scanning}>
          {scanning ? '…' : '⟳'} SCAN
        </button>

        <button
          className={`${styles.connectBtn} ${arduinoStatus.connected ? styles.danger : styles.primary}`}
          onClick={handleToggle}
          disabled={wsState !== 'connected'}
        >
          {arduinoStatus.connected ? 'DISCONNECT' : 'CONNECT'}
        </button>
      </div>

      {arduinoStatus.error && (
        <p className={styles.error}>⚠ {arduinoStatus.error}</p>
      )}
    </section>
  )
}
