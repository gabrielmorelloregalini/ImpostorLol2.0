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
  for (let i = 0; i < 3; i++) {
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
    console.log(`[CREAR] Sala ${code} creada por "${playerName}" (socket: ${socket.id}, id: ${playerId})`)
  })

  socket.on('join_room', ({ code, playerName }, callback) => {
    const roomCode = code.toUpperCase()
    const room = rooms[roomCode]

    if (!room) {
      console.log(`[ERROR] join_room - Sala no existe: ${code}`)
      if (callback) callback({ error: 'La sala no existe' })
      return
    }

    if (room.phase !== 'lobby') {
      console.log(`[ERROR] join_room - ${roomCode} ya empezo (fase: ${room.phase})`)
      if (callback) callback({ error: 'La partida ya empezo' })
      return
    }

    if (room.players.length >= 20) {
      console.log(`[ERROR] join_room - ${roomCode} llena (${room.players.length}/20)`)
      if (callback) callback({ error: 'Sala llena (max 20)' })
      return
    }

    const playerId = uuidv4()
    room.players.push({ id: playerId, name: playerName, socketId: socket.id })

    socket.join(roomCode)
    console.log(`[UNIR] "${playerName}" se unio a ${roomCode} (total: ${room.players.length} jugadores)`)

    if (callback) {
      callback({ code: roomCode, playerId, isHost: false })
    }

    broadcastRoomUpdate(roomCode)
    console.log(`[UNIR] Jugadores en ${roomCode}: [${room.players.map(p => p.name).join(', ')}]`)
  })

  socket.on('start_game', ({ code, wordPack, numImpostors }, callback) => {
    const room = rooms[code]
    if (!room) {
      console.log(`[ERROR] start_game - Sala no encontrada: ${code}`)
      if (callback) callback({ error: 'Sala no encontrada' })
      return
    }

    if (room.host !== socket.id) {
      console.log(`[ERROR] ${socket.id} intento iniciar juego en ${code} sin ser host`)
      if (callback) callback({ error: 'Solo el host puede empezar' })
      return
    }

    if (room.players.length < 3) {
      console.log(`[ERROR] ${code} - Solo ${room.players.length} jugadores, minimo 3`)
      if (callback) callback({ error: 'Minimo 3 jugadores' })
      return
    }

    room.config = { wordPack: wordPack || 'LOL - Todos los Campeones', numImpostors: numImpostors || 1 }

    // Pick secret word
    const pack = wordPacks[room.config.wordPack] || wordPacks['LOL - Todos los Campeones']
    room.secretWord = pack[Math.floor(Math.random() * pack.length)]
    console.log(`[PARTIDA] ${code} - Palabra secreta: "${room.secretWord}"`)

    // Assign impostors (random, no siempre el host)
    const shuffled = shuffle(room.players)
    const impostorIds = new Set(shuffled.slice(0, room.config.numImpostors).map(p => p.id))
    console.log(`[PARTIDA] ${code} - Orden shuffled: [${shuffled.map(p => p.name).join(', ')}]`)
    const impostores = room.players.filter(p => impostorIds.has(p.id)).map(p => p.name)
    console.log(`[PARTIDA] ${code} - IMPOSTORES: ${impostores.join(', ') || 'NINGUNO (ERROR)'}`)
    room.roles = {}
    room.players.forEach(p => {
      room.roles[p.id] = impostorIds.has(p.id)
    })

    room.phase = 'roleReveal'
    room.revealsComplete = new Set()
    console.log(`[PARTIDA] ${code} - Fase cambiada a roleReveal con ${room.config.numImpostors} impostor(es)`)

    // Send each player their role privately
    room.players.forEach(p => {
      const isImpostor = room.roles[p.id]
      console.log(`[ENVIAR] A ${p.name}(${p.socketId}): isImpostor=${isImpostor}`)
      io.to(p.socketId).emit('role_assigned', {
        isImpostor,
        secretWord: isImpostor ? null : room.secretWord,
        players: room.players.map(pl => ({ id: pl.id, name: pl.name })),
      })
    })

    broadcastRoomUpdate(code)
    if (callback) callback({ success: true })
    console.log(`[PARTIDA] Partida iniciada en ${code}.`)
  })

  socket.on('reveal_complete', ({ code, playerId }) => {
    const room = rooms[code]
    if (!room) {
      console.log(`[ERROR] reveal_complete - Sala no encontrada: ${code}`)
      return
    }

    const player = room.players.find(p => p.id === playerId)
    room.revealsComplete.add(playerId)
    console.log(`[REVEAL] "${player ? player.name : '???'}" confirmo en ${code} (${room.revealsComplete.size}/${room.players.length})`)

    if (room.revealsComplete.size >= room.players.length) {
      console.log(`[REVEAL] Todos confirmaron en ${code}, volviendo a lobby`)
      room.secretWord = ''
      room.roles = {}
      room.revealsComplete = new Set()
      room.winner = null
      room.phase = 'lobby'
      broadcastRoomUpdate(code)
      io.to(code).emit('phase_change', { phase: 'lobby' })
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(`[DESCONEXION] socket ${socket.id} - razon: ${reason}`)
    for (const code of Object.keys(rooms)) {
      const room = rooms[code]
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id)
      if (playerIndex === -1) continue

      const [left] = room.players.splice(playerIndex, 1)
      console.log(`[DESCONEXION] "${left.name}" salio de ${code}`)

      if (room.host === socket.id) {
        console.log(`[DESCONEXION] Sala ${code} cerrada (era el host)`)
        io.to(code).emit('room_closed', { reason: 'El host se desconecto' })
        delete rooms[code]
      } else {
        broadcastRoomUpdate(code)
        io.to(code).emit('player_left', { playerId: left.id })
        console.log(`[DESCONEXION] ${code} ahora tiene ${room.players.length} jugadores: [${room.players.map(p => p.name).join(', ')}]`)
      }
      break
    }
  })
})

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
