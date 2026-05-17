import { createContext, useContext, useState, useCallback } from 'react'
import { connect, disconnect, setErrorHandler } from '../services/socketService'
import wordPacks from '../data/words'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [mode, setMode] = useState(null)
  const [phase, setPhase] = useState('home')
  const [players, setPlayers] = useState([])
  const [myPlayerId, setMyPlayerId] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [roomCode, setRoomCode] = useState(null)
  const [secretWord, setSecretWord] = useState('')
  const [winner, setWinner] = useState(null)
  const [socket, setSocket] = useState(null)
  const [error, setError] = useState(null)

  const reset = useCallback(() => {
    setMode(null)
    setPhase('home')
    setPlayers([])
    setMyPlayerId(null)
    setIsHost(false)
    setRoomCode(null)
    setSecretWord('')
    setWinner(null)
    setError(null)
    if (socket) {
      disconnect()
      setSocket(null)
    }
  }, [socket])

  const startLocalGame = useCallback((config) => {
    setMode('local')
    setPhase('roleReveal')
    setPlayers(config.players)
    setSecretWord(config.secretWord)
    setWinner(null)
  }, [])

  const createOnlineRoom = useCallback(async ({ playerName, wordPack, numImpostors }) => {
    setError(null)
    setErrorHandler(setError)
    const s = await connect()
    setSocket(s)

    return new Promise((resolve, reject) => {
      s.emit('create_room', { playerName, config: { wordPack, numImpostors } }, (response) => {
        if (response.error) {
          setError(response.error)
          reject(response.error)
          return
        }
        setMode('online')
        setPhase('lobby')
        setRoomCode(response.code)
        setMyPlayerId(response.playerId)
        setIsHost(response.isHost)
        setPlayers([{ id: response.playerId, name: playerName }])

        s.on('room_update', (data) => {
          setPlayers(data.players)
        })

        s.on('room_closed', (data) => {
          setError(data.reason)
          reset()
        })

        s.on('role_assigned', (data) => {
          setPlayers(data.players)
          setSecretWord(data.secretWord || '')
          setPhase('roleReveal')
        })

        s.on('phase_change', (data) => {
          if (data.phase === 'result') {
            setPhase('result')
          }
        })

        s.on('game_result', (data) => {
          setWinner(data.winner)
          setSecretWord(data.secretWord)
          setPlayers(data.players)
          setPhase('result')
        })

        resolve(response)
      })
    })
  }, [reset])

  const joinOnlineRoom = useCallback(async ({ code, playerName }) => {
    setError(null)
    setErrorHandler(setError)
    const s = await connect()
    setSocket(s)

    return new Promise((resolve, reject) => {
      s.emit('join_room', { code, playerName }, (response) => {
        if (response.error) {
          setError(response.error)
          reject(response.error)
          return
        }
        setMode('online')
        setPhase('lobby')
        setRoomCode(response.code)
        setMyPlayerId(response.playerId)
        setIsHost(response.isHost)

        s.on('room_update', (data) => {
          setPlayers(data.players)
        })

        s.on('room_closed', (data) => {
          setError(data.reason)
          reset()
        })

        s.on('role_assigned', (data) => {
          setPlayers(data.players)
          setSecretWord(data.secretWord || '')
          setPhase('roleReveal')
        })

        s.on('phase_change', (data) => {
          if (data.phase === 'result') {
            setPhase('result')
          }
        })

        s.on('game_result', (data) => {
          setWinner(data.winner)
          setSecretWord(data.secretWord)
          setPlayers(data.players)
          setPhase('result')
        })

        resolve(response)
      })
    })
  }, [reset])

  const startOnlineGame = useCallback(({ wordPack, numImpostors }) => {
    if (!socket || !roomCode) return
    socket.emit('start_game', { code: roomCode, wordPack, numImpostors }, (response) => {
      if (response.error) {
        setError(response.error)
      }
    })
  }, [socket, roomCode])

  const revealComplete = useCallback(() => {
    if (mode === 'local') {
      setPhase('result')
      return
    }
    if (socket && roomCode && myPlayerId) {
      socket.emit('reveal_complete', { code: roomCode, playerId: myPlayerId })
      // wait for server to broadcast phase_change to 'result'
    }
  }, [mode, socket, roomCode, myPlayerId])

  const declareWinner = useCallback((winnerResult) => {
    if (mode === 'local') {
      setWinner(winnerResult)
      setPhase('result')
      return
    }
    if (socket && roomCode) {
      socket.emit('declare_winner', { code: roomCode, winner: winnerResult })
    }
  }, [mode, socket, roomCode])

  const value = {
    mode, phase, players, myPlayerId, isHost,
    roomCode, secretWord, winner, error,
    startLocalGame, createOnlineRoom, joinOnlineRoom,
    startOnlineGame, revealComplete, declareWinner,
    setPhase, setWinner, reset,
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
