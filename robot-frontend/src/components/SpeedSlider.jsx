import { useState } from 'react'
import styles from './SpeedSlider.module.css'

export default function SpeedSlider({ onSpeedChange, disabled }) {
  const [value, setValue] = useState(180)

  const handleChange = (e) => {
    const v = parseInt(e.target.value)
    setValue(v)
  }

  const handleCommit = (e) => {
    onSpeedChange(parseInt(e.target.value))
  }

  const pct = Math.round((value / 255) * 100)

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>// MOTOR SPEED</span>
        <span className={styles.val} style={{ color: value > 200 ? 'var(--yellow)' : 'var(--cyan)' }}>
          {value} <span className={styles.pct}>({pct}%)</span>
        </span>
      </div>

      <div className={styles.track}>
        <span className={styles.lab}>0</span>
        <input
          type="range"
          className={styles.slider}
          min={0} max={255}
          value={value}
          onChange={handleChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          disabled={disabled}
          style={{ '--pct': `${pct}%` }}
        />
        <span className={styles.lab}>255</span>
      </div>

      <div className={styles.presets}>
        {[64, 128, 180, 255].map(v => (
          <button
            key={v}
            className={`${styles.preset} ${value === v ? styles.active : ''}`}
            onClick={() => { setValue(v); onSpeedChange(v) }}
            disabled={disabled}
          >
            {v}
          </button>
        ))}
      </div>
    </section>
  )
}
