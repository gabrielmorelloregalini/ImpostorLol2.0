import express from 'express'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { Server } from 'socket.io'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 3001
const app = express()
app.use(cors())

// Serve frontend en produccion
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

const wordPacks = {
  "LOL - Todos los Campeones": [
    "Aatrox", "Ahri", "Akali", "Akshan", "Alistar", "Ambessa", "Amumu",
    "Anivia", "Annie", "Aphelios", "Ashe", "Aurelion Sol", "Aurora", "Azir",
    "Bard", "Bel'Veth", "Blitzcrank", "Brand", "Braum", "Briar",
    "Caitlyn", "Camille", "Cassiopeia", "Cho'Gath", "Corki",
    "Darius", "Diana", "Dr. Mundo", "Draven",
    "Ekko", "Elise", "Evelynn", "Ezreal",
    "Fiddlesticks", "Fiora", "Fizz",
    "Galio", "Gangplank", "Garen", "Gnar", "Gragas", "Graves", "Gwen",
    "Hecarim", "Heimerdinger", "Hwei",
    "Illaoi", "Irelia", "Ivern",
    "Janna", "Jarvan IV", "Jax", "Jayce", "Jhin", "Jinx",
    "Kai'Sa", "Kalista", "Karma", "Karthus", "Kassadin", "Katarina",
    "Kayle", "Kayn", "Kennen", "Kha'Zix", "Kindred", "Kled", "Kog'Maw", "K'Sante",
    "LeBlanc", "Lee Sin", "Leona", "Lillia", "Lissandra", "Lucian", "Lulu", "Lux",
    "Malphite", "Malzahar", "Maokai", "Master Yi", "Mel", "Milio",
    "Miss Fortune", "Mordekaiser", "Morgana",
    "Naafiri", "Nami", "Nasus", "Nautilus", "Neeko", "Nidalee", "Nilah",
    "Nocturne", "Nunu y Willump",
    "Olaf", "Orianna", "Ornn",
    "Pantheon", "Poppy", "Pyke",
    "Qiyana", "Quinn",
    "Rakan", "Rammus", "Rek'Sai", "Rell", "Renata Glasc", "Renekton",
    "Rengar", "Riven", "Rumble", "Ryze",
    "Samira", "Sejuani", "Senna", "Seraphine", "Sett", "Shaco", "Shen",
    "Shyvana", "Singed", "Sion", "Sivir", "Skarner", "Smolder", "Sona",
    "Soraka", "Swain", "Sylas", "Syndra",
    "Tahm Kench", "Taliyah", "Talon", "Taric", "Teemo", "Thresh",
    "Tristana", "Trundle", "Tryndamere", "Twisted Fate", "Twitch",
    "Udyr", "Urgot",
    "Varus", "Vayne", "Veigar", "Vel'Koz", "Vex", "Vi", "Viego",
    "Viktor", "Vladimir", "Volibear",
    "Warwick", "Wukong",
    "Xayah", "Xerath", "Xin Zhao",
    "Yasuo", "Yone", "Yorick", "Yunara", "Yuumi",
    "Zaahen", "Zac", "Zed", "Zeri", "Ziggs", "Zilean", "Zoe", "Zyra"
  ],
}

// In-memory room store
const rooms = {}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function getRoomPlayers(roomCode) {
  const room = rooms[roomCode]
  if (!room) return []
  return room.players.map(p => ({ id: p.id, name: p.name }))
}

function broadcastRoomUpdate(roomCode) {
  const room = rooms[roomCode]
  if (!room) return
  io.to(roomCode).emit('room_update', {
    code: roomCode,
    players: getRoomPlayers(roomCode),
    phase: room.phase,
    config: room.config,
  })
}

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`)

  socket.on('create_room', ({ playerName, config }, callback) => {
    let code = generateCode()
    while (rooms[code]) code = generateCode()

    const playerId = uuidv4()
    const room = {
      code,
      host: socket.id,
      players: [{ id: playerId, name: playerName, socketId: socket.id }],
      config: config || { wordPack: 'LOL - Todos los Campeones', numImpostors: 1 },
      secretWord: '',
      phase: 'lobby',
      roles: {},
      revealsComplete: new Set(),
      winner: null,
    }
    rooms[code] = room

    socket.join(code)

    if (callback) {
      callback({ code, playerId, isHost: true })
    }

    broadcastRoomUpdate(code)
    console.log(`Sala creada: ${code} por ${playerName}`)
  })

  socket.on('join_room', ({ code, playerName }, callback) => {
    const roomCode = code.toUpperCase()
    const room = rooms[roomCode]

    if (!room) {
      if (callback) callback({ error: 'La sala no existe' })
      return
    }

    if (room.phase !== 'lobby') {
      if (callback) callback({ error: 'La partida ya empezo' })
      return
    }

    if (room.players.length >= 20) {
      if (callback) callback({ error: 'Sala llena (max 20)' })
      return
    }

    const playerId = uuidv4()
    room.players.push({ id: playerId, name: playerName, socketId: socket.id })

    socket.join(roomCode)

    if (callback) {
      callback({ code: roomCode, playerId, isHost: false })
    }

    broadcastRoomUpdate(roomCode)
    console.log(`${playerName} se unio a ${roomCode}`)
  })

  socket.on('start_game', ({ code, wordPack, numImpostors }, callback) => {
    const room = rooms[code]
    if (!room) {
      if (callback) callback({ error: 'Sala no encontrada' })
      return
    }

    if (room.host !== socket.id) {
      if (callback) callback({ error: 'Solo el host puede empezar' })
      return
    }

    if (room.players.length < 3) {
      if (callback) callback({ error: 'Minimo 3 jugadores' })
      return
    }

    room.config = { wordPack: wordPack || 'LOL - Todos los Campeones', numImpostors: numImpostors || 1 }

    // Pick secret word
    const pack = wordPacks[room.config.wordPack] || wordPacks['LOL - Todos los Campeones']
    room.secretWord = pack[Math.floor(Math.random() * pack.length)]

    // Assign impostors (random, no siempre el host)
    const shuffled = shuffle(room.players)
    const impostorIds = new Set(shuffled.slice(0, room.config.numImpostors).map(p => p.id))
    room.roles = {}
    room.players.forEach(p => {
      room.roles[p.id] = impostorIds.has(p.id)
    })

    room.phase = 'roleReveal'
    room.revealsComplete = new Set()

    // Send each player their role privately
    room.players.forEach(p => {
      const isImpostor = room.roles[p.id]
      io.to(p.socketId).emit('role_assigned', {
        isImpostor,
        secretWord: isImpostor ? null : room.secretWord,
        players: room.players.map(pl => ({ id: pl.id, name: pl.name })),
      })
    })

    broadcastRoomUpdate(code)
    if (callback) callback({ success: true })
    console.log(`Partida iniciada en ${code}. Palabra: ${room.secretWord}`)
  })

  socket.on('reveal_complete', ({ code, playerId }) => {
    const room = rooms[code]
    if (!room) return

    room.revealsComplete.add(playerId)

    if (room.revealsComplete.size >= room.players.length) {
      room.secretWord = ''
      room.roles = {}
      room.revealsComplete = new Set()
      room.winner = null
      room.phase = 'lobby'
      broadcastRoomUpdate(code)
      io.to(code).emit('phase_change', { phase: 'lobby' })
    }
  })

  socket.on('disconnect', () => {
    for (const code of Object.keys(rooms)) {
      const room = rooms[code]
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id)
      if (playerIndex === -1) continue

      const [left] = room.players.splice(playerIndex, 1)

      if (room.host === socket.id) {
        // Host left: close room
        io.to(code).emit('room_closed', { reason: 'El host se desconecto' })
        delete rooms[code]
        console.log(`Sala ${code} cerrada (host desconectado)`)
      } else {
        broadcastRoomUpdate(code)
        io.to(code).emit('player_left', { playerId: left.id })
        console.log(`${left.name} salio de ${code}`)
      }
      break
    }
  })
})

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
