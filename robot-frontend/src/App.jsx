import { useCallback } from 'react'
import { useRobotWS } from './useRobotWS'
import ConnectionPanel from './components/ConnectionPanel'
import DPad from './components/DPad'
import EventLog from './components/EventLog'
import styles from './App.module.css'

export default function App() {
  const {
    wsState,
    arduinoStatus,
    logs,
    connectArduino,
    disconnectArduino,
    sendCommand,
  } = useRobotWS()

  const handleCommand = useCallback((action) => {
    sendCommand(action)
  }, [sendCommand])

  const controlsDisabled = !arduinoStatus.connected

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          ROBO<span className={styles.accent}>_</span>CTL
          <span className={styles.ver}>v2.0 · WebSocket</span>
        </div>
        <div className={styles.cursor} />
      </header>

      <main className={styles.main}>
        <ConnectionPanel
          arduinoStatus={arduinoStatus}
          wsState={wsState}
          onConnect={connectArduino}
          onDisconnect={disconnectArduino}
        />

        <section className={styles.card}>
          <div className={styles.cardTitle}>// MOVEMENT</div>
          <DPad onCommand={handleCommand} disabled={controlsDisabled} />
        </section>

        <EventLog logs={logs} />
      </main>
    </div>
  )
}
