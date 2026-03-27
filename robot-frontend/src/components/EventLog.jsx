import { useEffect, useRef } from 'react'
import styles from './EventLog.module.css'

const CLS_COLOR = {
  ok:  'var(--cyan)',
  err: 'var(--red)',
  cmd: 'var(--yellow)',
  ws:  'var(--violet)',
  '': 'var(--text-dim)',
}

export default function EventLog({ logs }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>// EVENT LOG</span>
        <span className={styles.count}>{logs.length} events</span>
      </div>
      <div className={styles.log}>
        {logs.map((entry, i) => (
          <div key={i} className={styles.line} style={{ color: CLS_COLOR[entry.cls] }}>
            <span className={styles.ts}>
              {new Date(entry.ts).toLocaleTimeString([], { hour12: false })}
            </span>
            <span>{entry.msg}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </section>
  )
}
