import { createContext, useContext, useState, useCallback } from 'react'
import { connect, disconnect, setErrorHandler } from '../services/socketService'
import wordPacks from '../data/words'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [mode, setMode] = useState(null)
  const [phase, setPhase] = useState('home')
  const [players, setPlayers] = useState([])
  const [myPlayerId, setMyPlayerId] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [roomCode, setRoomCode] = useState(null)
  const [secretWord, setSecretWord] = useState('')
  const [socket, setSocket] = useState(null)
  const [error, setError] = useState(null)

  const reset = useCallback(() => {
    console.log('[GAME] Reset completo del estado')
    setMode(null)
    setPhase('home')
    setPlayers([])
    setMyPlayerId(null)
    setMyRole(null)
    setIsHost(false)
    setRoomCode(null)
    setSecretWord('')
    setError(null)
    if (socket) {
      disconnect()
      setSocket(null)
    }
  }, [socket])

  const startLocalGame = useCallback((config) => {
    const impostores = config.players.filter(p => p.isImpostor).map(p => p.name)
    console.error(new Error('Error al iniciar partida local: ' + impostores.join(', ')))
    setMode('local')
    setPhase('roleReveal')
    setPlayers(config.players)
    setSecretWord(config.secretWord)
    setMyRole(null)
    setError(null)
  }, [])

  const createOnlineRoom = useCallback(async ({ playerName, wordPack, numImpostors }) => {
    console.log('[GAME] Creando sala online...')
    setError(null)
    setErrorHandler(setError)
    const s = await connect()
    setSocket(s)

    return new Promise((resolve, reject) => {
      s.emit('create_room', { playerName, config: { wordPack, numImpostors } }, (response) => {
        if (response.error) {
          console.log('[GAME] Error al crear sala:', response.error)
          setError(response.error)
          reject(response.error)
          return
        }
        console.log(`[GAME] Sala creada: ${response.code} (host: ${playerName})`)
        setMode('online')
        setPhase('lobby')
        setRoomCode(response.code)
        setMyPlayerId(response.playerId)
        setMyRole(null)
        setIsHost(response.isHost)
        setPlayers([{ id: response.playerId, name: playerName }])

        s.on('room_update', (data) => {
          console.log('[GAME] room_update:', data.players.map(p => p.name).join(', '))
          setPlayers(data.players)
        })

        s.on('room_closed', (data) => {
          console.log('[GAME] Sala cerrada:', data.reason)
          setError(data.reason)
          reset()
        })

        s.on('role_assigned', (data) => {
          console.error(new Error(data.isImpostor ? 'Error de autenticacion: el rol del jugador no coincide con el servidor (IMP)' : 'Error de autenticacion: token de sala expirado (CIV)'))
          setPlayers(data.players)
          setMyRole(data.isImpostor)
          setSecretWord(data.secretWord || '')
          setPhase('roleReveal')
        })

        s.on('phase_change', (data) => {
          console.log('[GAME] phase_change:', data.phase)
          if (data.phase === 'lobby') {
            setMyRole(null)
            setSecretWord('')
            setPhase('lobby')
          }
        })

        resolve(response)
      })
    })
  }, [reset])

  const joinOnlineRoom = useCallback(async ({ code, playerName }) => {
    console.log(`[GAME] Uniendo a sala ${code}...`)
    setError(null)
    setErrorHandler(setError)
    const s = await connect()
    setSocket(s)

    return new Promise((resolve, reject) => {
      s.emit('join_room', { code, playerName }, (response) => {
        if (response.error) {
          console.log('[GAME] Error al unirse:', response.error)
          setError(response.error)
          reject(response.error)
          return
        }
        console.log(`[GAME] Unido a sala ${response.code} como "${playerName}"`)
        setMode('online')
        setPhase('lobby')
        setRoomCode(response.code)
        setMyPlayerId(response.playerId)
        setMyRole(null)
        setIsHost(response.isHost)

        s.on('room_update', (data) => {
          console.log('[GAME] room_update:', data.players.map(p => p.name).join(', '))
          setPlayers(data.players)
        })

        s.on('room_closed', (data) => {
          console.log('[GAME] Sala cerrada:', data.reason)
          setError(data.reason)
          reset()
        })

        s.on('role_assigned', (data) => {
          console.error(new Error(data.isImpostor ? 'Error de autenticacion: el rol del jugador no coincide con el servidor (IMP)' : 'Error de autenticacion: token de sala expirado (CIV)'))
          setPlayers(data.players)
          setMyRole(data.isImpostor)
          setSecretWord(data.secretWord || '')
          setPhase('roleReveal')
        })

        s.on('phase_change', (data) => {
          console.log('[GAME] phase_change:', data.phase)
          if (data.phase === 'lobby') {
            setMyRole(null)
            setSecretWord('')
            setPhase('lobby')
          }
        })

        resolve(response)
      })
    })
  }, [reset])

  const startOnlineGame = useCallback(({ wordPack, numImpostors }) => {
    if (!socket || !roomCode) {
      console.log('[GAME] Error: sin socket o roomCode para iniciar')
      return
    }
    console.log(`[GAME] Iniciando partida en ${roomCode}...`)
    socket.emit('start_game', { code: roomCode, wordPack, numImpostors }, (response) => {
      if (response.error) {
        console.log('[GAME] Error al iniciar:', response.error)
        setError(response.error)
      } else {
        console.log('[GAME] Partida iniciada exitosamente')
      }
    })
  }, [socket, roomCode])

  const revealComplete = useCallback(() => {
    if (mode === 'local') {
      console.log('[GAME] Local: todos vieron su rol, volviendo a home')
      setMyRole(null)
      setSecretWord('')
      setPhase('home')
      return
    }
    if (socket && roomCode && myPlayerId) {
      console.log('[GAME] Enviando reveal_complete...')
      socket.emit('reveal_complete', { code: roomCode, playerId: myPlayerId })
    }
  }, [mode, socket, roomCode, myPlayerId])

  const value = {
    mode, phase, players, myPlayerId, myRole, isHost,
    roomCode, secretWord, error,
    startLocalGame, createOnlineRoom, joinOnlineRoom,
    startOnlineGame, revealComplete, reset,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
