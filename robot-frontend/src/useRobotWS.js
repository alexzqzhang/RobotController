import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = 'ws://localhost:3001'

export function useRobotWS() {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const [wsState, setWsState]           = useState('disconnected') // 'disconnected' | 'connecting' | 'connected'
  const [arduinoStatus, setArduinoStatus] = useState({ connected: false, port: null, error: null })
  const [logs, setLogs]                 = useState([{ msg: 'Robot Control Panel ready', cls: 'ok', ts: Date.now() }])

  const addLog = useCallback((msg, cls = '') => {
    setLogs(prev => [...prev.slice(-99), { msg, cls, ts: Date.now() }])
  }, [])

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    } else {
      addLog('WebSocket not connected', 'err')
    }
  }, [addLog])

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'status':
        setArduinoStatus({ connected: msg.connected, port: msg.port, error: msg.error })
        if (msg.connected) addLog(`Arduino online — ${msg.port}`, 'ok')
        else if (msg.error) addLog(`Arduino error: ${msg.error}`, 'err')
        break
      case 'ack':
        if (!msg.success) {
          addLog(`ERR [${msg.action}] ${msg.error}`, 'err')
        } else if (msg.action === 'command') {
          const label = msg.auto ? 'AUTO-STOP' : msg.command?.toUpperCase()
          addLog(`CMD  ${label}${msg.auto_stop_ms ? `  (auto-stop ${msg.auto_stop_ms}ms)` : ''}`, 'cmd')
        } else if (msg.action === 'speed') {
          addLog(`SPEED → ${msg.speed}`, 'cmd')
        } else if (msg.info) {
          addLog(msg.info, 'ws')
        }
        break
      case 'serial_data':
        addLog(`↩ Arduino: ${msg.data.trim()}`, 'ws')
        break
      case 'pong':
        break
      default:
        break
    }
  }, [addLog])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    setWsState('connecting')
    addLog('Connecting to server…', 'ws')

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setWsState('connected')
      addLog('WebSocket connected', 'ok')
      clearTimeout(reconnectTimer.current)
    }

    ws.onclose = () => {
      setWsState('disconnected')
      setArduinoStatus({ connected: false, port: null, error: null })
      addLog('WebSocket disconnected — retrying in 3s…', 'err')
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => setWsState('disconnected')

    ws.onmessage = ({ data }) => {
      try { handleMessage(JSON.parse(data)) } catch {}
    }
  }, [addLog, handleMessage])

  useEffect(() => {
    connect()
    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 10000)
    return () => {
      clearInterval(ping)
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  // Arduino connect/disconnect
  const connectArduino = useCallback((port) => {
    send({ type: 'connect', port })
  }, [send])

  const disconnectArduino = useCallback(() => {
    send({ type: 'disconnect' })
  }, [send])

  // Robot commands
  const sendCommand = useCallback((action, duration) => {
    send({ type: 'command', action, ...(duration ? { duration } : {}) })
  }, [send])

  return {
    wsState,
    arduinoStatus,
    logs,
    connectArduino,
    disconnectArduino,
    sendCommand,
  }
}
