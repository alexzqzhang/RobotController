const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");
const { SerialPort } = require("serialport");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const BAUD_RATE = 9600;

const COMMANDS = {
  forward:  "F",
  backward: "B",
  left:     "L",
  right:    "R",
  stop:     "S",
};

let serialPort = null;
let connectionStatus = { connected: false, port: null, error: null };
let autoStopTimer = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

function sendSerial(cmd) {
  return new Promise((resolve, reject) => {
    if (!serialPort || !serialPort.isOpen) return reject(new Error("Arduino not connected"));
    serialPort.write(cmd, err => err ? reject(err) : resolve());
  });
}

async function connectSerial(portPath) {
  if (serialPort && serialPort.isOpen) {
    await new Promise(r => serialPort.close(r));
  }

  serialPort = new SerialPort({ path: portPath, baudRate: BAUD_RATE });

  serialPort.on("error", err => {
    connectionStatus = { connected: false, port: null, error: err.message };
    serialPort = null;
    broadcast({ type: "status", ...connectionStatus });
  });

  // Forward any data coming FROM the Arduino to all WS clients
  serialPort.on("data", data => {
    broadcast({ type: "serial_data", data: data.toString() });
  });

  // Wait for Arduino reset
  await new Promise(r => setTimeout(r, 2000));

  connectionStatus = { connected: true, port: portPath, error: null };
  broadcast({ type: "status", ...connectionStatus });
}

// ── Serve frontend ────────────────────────────────────────────────────────────
app.use(express.static(__dirname));

// ── REST – port listing only (handy for initial dropdown) ─────────────────────
app.get("/api/ports", async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json({ ports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── WebSocket message handler ─────────────────────────────────────────────────
// All messages are JSON: { type, ...payload }
//
// Client → Server:
//   { type: "connect",    port: "/dev/ttyUSB0" }
//   { type: "disconnect" }
//   { type: "command",   action: "forward", duration?: 500 }
//   { type: "speed",     value: 200 }
//   { type: "ping" }
//
// Server → Client:
//   { type: "status",      connected, port, error }
//   { type: "ack",         action, success, ...extras }
//   { type: "serial_data", data: "..." }
//   { type: "pong" }

wss.on("connection", ws => {
  console.log("WS client connected");

  // Immediately send current status to the new client
  ws.send(JSON.stringify({ type: "status", ...connectionStatus }));

  ws.on("message", async raw => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return ws.send(JSON.stringify({ type: "ack", success: false, error: "Invalid JSON" })); }

    const reply = payload => ws.send(JSON.stringify(payload));

    switch (msg.type) {

      case "ping":
        reply({ type: "pong" });
        break;

      case "connect": {
        if (!msg.port) return reply({ type: "ack", action: "connect", success: false, error: "No port specified" });
        reply({ type: "ack", action: "connect", success: true, info: `Connecting to ${msg.port}…` });
        try {
          await connectSerial(msg.port);
          broadcast({ type: "ack", action: "connect", success: true, port: msg.port });
        } catch (err) {
          connectionStatus = { connected: false, port: null, error: err.message };
          broadcast({ type: "ack", action: "connect", success: false, error: err.message });
          broadcast({ type: "status", ...connectionStatus });
        }
        break;
      }

      case "disconnect": {
        try {
          if (serialPort && serialPort.isOpen) {
            await sendSerial("S").catch(() => {});
            await new Promise(r => serialPort.close(r));
          }
          serialPort = null;
          connectionStatus = { connected: false, port: null, error: null };
          broadcast({ type: "status", ...connectionStatus });
          broadcast({ type: "ack", action: "disconnect", success: true });
        } catch (err) {
          reply({ type: "ack", action: "disconnect", success: false, error: err.message });
        }
        break;
      }

      case "command": {
        const { action, duration } = msg;
        if (!COMMANDS[action]) {
          return reply({ type: "ack", action: "command", success: false,
            error: `Unknown action '${action}'. Valid: ${Object.keys(COMMANDS).join(", ")}` });
        }
        try {
          await sendSerial(COMMANDS[action]);
          const response = { type: "ack", action: "command", success: true, command: action };

          if (duration && action !== "stop") {
            if (autoStopTimer) clearTimeout(autoStopTimer);
            autoStopTimer = setTimeout(async () => {
              try {
                await sendSerial("S");
                broadcast({ type: "ack", action: "command", success: true, command: "stop", auto: true });
              } catch (_) {}
            }, duration);
            response.auto_stop_ms = duration;
          }

          broadcast(response);
        } catch (err) {
          reply({ type: "ack", action: "command", success: false, error: err.message });
        }
        break;
      }

      default:
        reply({ type: "ack", success: false, error: `Unknown message type: ${msg.type}` });
    }
  });

  ws.on("close", () => console.log("WS client disconnected"));
});

// ── Mock mode ─────────────────────────────────────────────────────────────────
if (process.env.MOCK) {
  console.log("⚡ Running in MOCK mode — no Arduino required");
  serialPort = { isOpen: true, write: (_, cb) => cb && cb(), on: () => {}, close: cb => cb && cb() };
  connectionStatus = { connected: true, port: "MOCK", error: null };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🤖 Robot backend (HTTP + WS) → ws://localhost:${PORT}`);
});
