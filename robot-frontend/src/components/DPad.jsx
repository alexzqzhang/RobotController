import { useEffect, useCallback, useRef, useState } from 'react'
import styles from './DPad.module.css'

const DIRECTIONS = [
  { action: 'forward',  label: '▲', area: 'up'    },
  { action: 'left',     label: '◀', area: 'left'  },
  { action: 'stop',     label: '■', area: 'stop'  },
  { action: 'right',    label: '▶', area: 'right' },
  { action: 'backward', label: '▼', area: 'down'  },
]

const KEY_MAP = {
  ArrowUp: 'forward',    w: 'forward',
  ArrowDown: 'backward', s: 'backward',
  ArrowLeft: 'left',     a: 'left',
  ArrowRight: 'right',   d: 'right',
  ' ': 'stop',
}

export default function DPad({ onCommand, disabled }) {
  const pressed = useRef(new Set())
  const activeAction = useRef(null)
  const [activeBtn, setActiveBtn] = useState(null)

  const startAction = useCallback((action) => {
    if (disabled) return
    setActiveBtn(action)
    if (action === 'stop') { onCommand('stop'); return }
    activeAction.current = action
    onCommand(action)
  }, [disabled, onCommand])

  const endAction = useCallback(() => {
    setActiveBtn(null)
    if (activeAction.current && activeAction.current !== 'stop') {
      onCommand('stop')
      activeAction.current = null
    }
  }, [onCommand])

  useEffect(() => {
    const down = (e) => {
      const action = KEY_MAP[e.key]
      if (!action || pressed.current.has(e.key)) return
      pressed.current.add(e.key)
      startAction(action)
      e.preventDefault()
    }
    const up = (e) => {
      if (!KEY_MAP[e.key]) return
      pressed.current.delete(e.key)
      if (pressed.current.size === 0) endAction()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [startAction, endAction])

  const btnProps = (action) => ({
    onMouseDown:  () => startAction(action),
    onMouseUp:    endAction,
    onMouseLeave: endAction,
    onTouchStart: (e) => { e.preventDefault(); startAction(action) },
    onTouchEnd:   endAction,
  })

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.dpadContainer} ${disabled ? styles.locked : ''}`}>
        <div className={styles.dpad}>
          {DIRECTIONS.map(({ action, label, area }) => (
            <button
              key={action}
              className={`${styles.btn} ${styles[area]} ${activeBtn === action ? styles.pressed : ''}`}
              {...(action === 'stop'
                ? { onMouseDown: () => startAction('stop'), onMouseUp: endAction }
                : btnProps(action)
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {disabled && (
          <div className={styles.overlay}>
            <span className={styles.overlayText}>Connect Arduino to drive</span>
          </div>
        )}
      </div>

      <div className={styles.hint}>
        {['W','A','S','D'].map(k => <span key={k} className={styles.key}>{k}</span>)}
        <span className={styles.sep}>/</span>
        {['↑','←','↓','→'].map(k => <span key={k} className={styles.key}>{k}</span>)}
        <span className={styles.sep}>·</span>
        <span className={styles.key}>Space</span>
        <span className={styles.sep}>= Stop</span>
      </div>
    </div>
  )
}
